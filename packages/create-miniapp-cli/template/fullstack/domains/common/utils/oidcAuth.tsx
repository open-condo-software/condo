import { Spin } from 'antd'
import isObject from 'lodash/isObject'
import getConfig from 'next/config'
import Router, { useRouter } from 'next/router'
import React, { useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'

import { useLaunchParams } from '~/domains/common/hooks/useLaunchParams'

interface IUseOidcAuthHookValue {
    user?: {
        id: string
        name: string
        isAdmin: boolean
        organizationId: string
    }
    isLoading?: boolean
}

const OIDC_AUTH_URL = '/oidc/auth'

const OidcAuthContext = React.createContext<IUseOidcAuthHookValue>({})

const useOidcAuth = () => useContext(OidcAuthContext)

const OidcAuthProvider = ({ children }) => {
    const { context, loading, error } = useLaunchParams()
    const { user, isLoading: isUserLoading, isAuthenticated } = useAuth()

    const errorReason = error?.errorReason
    const errorData = isObject(error) ? JSON.stringify(error) : '<NonObject>'

    const isSameDomain = useMemo<boolean>(() => {
        const { publicRuntimeConfig: { serverUrl, condoUrl } } = getConfig()

        if (!serverUrl || !condoUrl) {
            return false
        }

        const appHostnameParts = (new URL(serverUrl)).hostname.split('.').reverse()
        const condoHostnameParts = (new URL(condoUrl)).hostname.split('.').reverse()

        let equalPartsCount = 0
        for (let i = 0; i < Math.min(appHostnameParts.length, condoHostnameParts.length); i++) {
            if (appHostnameParts[i] === condoHostnameParts[i]) {
                equalPartsCount++
            }
        }

        return equalPartsCount >= 2
    }, [])

    const [hasStorageAccess, setHasStorageAccess] = useState<boolean>(isSameDomain || typeof document === 'undefined' || !document.hasStorageAccess || !document.requestStorageAccess)

    const isAllLoaded = !loading && !isUserLoading

    useEffect(() => {
        if (isAllLoaded && hasStorageAccess) {
            if (!isAuthenticated || user.id !== context.condoUserId) {
                Router.push({
                    pathname: OIDC_AUTH_URL,
                    query: {
                        condoUserId: context.condoUserId,
                        condoOrganizationId: context.condoContextEntityId,
                        next: Router.pathname,
                    },
                })
            }
        }

    }, [isAllLoaded, user, isAuthenticated, hasStorageAccess, context.condoUserId, context.condoContextEntityId])

    useEffect(() => {
        if (!hasStorageAccess && typeof document !== 'undefined' && document.hasStorageAccess) {
            document.hasStorageAccess().then(
                (hasAccess) => {
                    setHasStorageAccess(hasAccess)
                },
                () => {
                    setHasStorageAccess(false)
                },
            )
        }
    }, [hasStorageAccess])

    return (
        <OidcAuthContext.Provider value={{ user, isLoading: (isUserLoading || loading) }}>
            {
                (isAllLoaded && isAuthenticated && user.id === context.condoUserId)
                    ? children
                    : (errorReason === 'TIMEOUT_REACHED' && isAuthenticated)
                        ? <div><b>user={user.id}</b><br/>Condo Bridge ERROR. Are you inside an iFrame? <br/><br/><small>{errorData}</small></div>
                        : <Spin size='large' />
            }
        </OidcAuthContext.Provider>
    )
}

const withOidcAuth = ({ resolveBypass = (data) => false }) => (PageComponent) => {
    const WithOidcAuth = (pageProps) => {
        const router = useRouter()
        if (resolveBypass({ router, ...pageProps })) {
            return <PageComponent {...pageProps} />
        }

        return (
            <OidcAuthProvider>
                <PageComponent {...pageProps} />
            </OidcAuthProvider>
        )
    }

    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithOidcAuth.displayName = `withOidcAuth(${displayName})`
    }

    return WithOidcAuth
}

export { useOidcAuth, withOidcAuth }

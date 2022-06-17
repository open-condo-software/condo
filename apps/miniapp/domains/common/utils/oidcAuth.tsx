import { useAuth } from '@core/next/auth'
import { useOrganization } from '@miniapp/domains/common/utils/organization'
import getConfig from 'next/config'
import Router from 'next/router'
import React, { useContext, useEffect } from 'react'
import { createCondoBridge } from '@miniapp/domains/common/clients/CondoBridge'

interface IUseOidcAuthHookValue {
    user?: any,
    isLoading?: boolean,
}

const OIDC_AUTH_URL = '/oidc/auth'

const { publicRuntimeConfig: { condoUrl } } = getConfig()
const condoBridge = createCondoBridge({ receiverOrigin: condoUrl })

const OidcAuthContext = React.createContext<IUseOidcAuthHookValue>({})

const useOidcAuth = () => useContext(OidcAuthContext)

const OidcAuthProvider = ({ children }) => {
    const { organization: condoOrganization, isLoading: isOrganizationLoading } = useOrganization()
    const { result: condoUser, isLoading: isCondoUserLoading } = condoBridge.useUser()
    const { user, isLoading: isUserLoading, isAuthenticated } = useAuth()

    const isAllLoaded = !isOrganizationLoading && !isCondoUserLoading && !isUserLoading

    useEffect(() => {
        if (isAllLoaded) {
            if (!isAuthenticated || user.id !== condoUser.id || user.organizationId !== condoOrganization.id) {
                console.debug('OidcAuthProvider: redirect to oidc auth', {
                    OIDC_AUTH_URL,
                    organizationId: condoOrganization.id,
                })
                Router.push({
                    pathname: OIDC_AUTH_URL,
                    query: { organizationId: condoOrganization.id, condoUserId: condoUser.id },
                })
            }
        }

    }, [isAllLoaded, user, isAuthenticated, condoUser, condoOrganization])

    return (
        <OidcAuthContext.Provider value={{ user, isLoading: (isUserLoading || isOrganizationLoading) }}>
            {
                (isAllLoaded && isAuthenticated && user.id === condoUser.id && user.organizationId === condoOrganization.id)
                    ? children
                    : <div>OIDC Authorization...</div>
            }
        </OidcAuthContext.Provider>
    )
}

const withOidcAuth = () => (PageComponent) => {
    const WithOidcAuth = (pageProps) => {
        return (
            <OidcAuthProvider>
                <PageComponent {...pageProps} />
            </OidcAuthProvider>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithOidcAuth.displayName = `withOidcAuth(${displayName})`
    }

    return WithOidcAuth
}

export { useOidcAuth, withOidcAuth }

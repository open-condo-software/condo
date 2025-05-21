import get from 'lodash/get'
import isObject from 'lodash/isObject'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'

import { useLaunchParams } from '@{{name}}/domains/common/hooks/useLaunchParams'
import { LoadingOrError } from '@{{name}}/domains/common/components/containers/LoadingOrError'


const { publicRuntimeConfig: { serverUrl, condoUrl } } = getConfig()


interface IUseOidcAuthHookValue {
    user?: {
        id: string
        name: string
        isAdmin: boolean
        organizationId: string
    },
    isLoading?: boolean,
}

const OidcAuthContext = React.createContext<IUseOidcAuthHookValue>({})

const useOidcAuth = (): IUseOidcAuthHookValue => useContext<IUseOidcAuthHookValue>(OidcAuthContext)

const isSameDomain = (serverUrl, condoUrl) => {
    if (!serverUrl || !condoUrl) {
        return false
    }

    const serverHostnameParts = (new URL(serverUrl)).hostname.split('.').reverse()
    const condoHostnameParts = (new URL(condoUrl)).hostname.split('.').reverse()

    let equalPartsCount = 0
    for (let i = 0; i < Math.min(serverHostnameParts.length, condoHostnameParts.length); i++) {
        if (serverHostnameParts[i] === condoHostnameParts[i]) {
            equalPartsCount++
        }
    }

    return equalPartsCount >= 2
}

const OidcAuthProvider = ({ children }) => {
    const intl = useIntl()
    const NoAccessToStorageMessage = intl.formatMessage({ id: 'NoAccessToStorage' })
    const AskForAccessButtonMessage = intl.formatMessage({ id: 'AskForAccessButton' })
    const AskForOpenWindowButtonMessage = intl.formatMessage({ id: 'AskForOpenWindowButton' })
    const NoAbleToAskForStorageAccessMessage = intl.formatMessage({ id: 'NoAbleToAskForStorageAccess' })

    const { context, loading, error } = useLaunchParams()
    const errorReason = get(error, 'errorReason')
    const errorData = isObject(error) ? JSON.stringify(error) : '<NonObject>'
    const { user, isLoading: isUserLoading, isAuthenticated } = useAuth()

    /**
     * In the case of Safari we have to ask browser to grant access to condo's session cookie using Storage Access API
     * @link https://webkit.org/blog/8124/introducing-storage-access-api/
     */
    const [hasStorageAccess, setHasStorageAccess] = useState<boolean>(isSameDomain(serverUrl, condoUrl) || typeof document === 'undefined' || !document.hasStorageAccess || !document.requestStorageAccess)
    const [windowOpened, setWindowOpened] = useState<boolean>(false)

    const isAllLoaded = !loading && !isUserLoading

    useEffect(() => {
        if (!hasStorageAccess && typeof document !== 'undefined' && document.hasStorageAccess) {
            document.hasStorageAccess().then(
                (hasAccess) => {
                    // Boolean hasAccess says whether the document has access or not.
                    console.debug({ msg: 'document.hasStorageAccess() resolved', data: { hasAccess } })
                    setHasStorageAccess(hasAccess)
                },
                (reason) => {
                    // Promise was rejected for some reason.
                    console.debug({ msg: 'document.hasStorageAccess() rejected', data: { reason } })
                    setHasStorageAccess(false)
                },
            )
        }
    }, [hasStorageAccess])

    const requestAccessToStorage = useCallback(() => {
        if (!hasStorageAccess && typeof document !== 'undefined' && document.requestStorageAccess) {
            document.requestStorageAccess().then(
                () => {
                    // Storage access was granted.
                    console.debug({ msg: 'document.requestStorageAccess(): access granted' })
                    setHasStorageAccess(true)
                },
                () => {
                    // Storage access was denied.
                    console.debug({ msg: 'document.requestStorageAccess(): access denied' })
                    setHasStorageAccess(false)
                },
            )
        }
    }, [hasStorageAccess])

    const openGrantPage = useCallback(() => {
        window.open(`${window.location.origin}/grant-storage-access/grantString${Math.random().toString(16).substring(2)}`) // NOSONAR
        setWindowOpened(true)
    }, [])

    const value = useMemo(() => ({ user, isLoading: (isUserLoading || loading) }),
        [user, isUserLoading, loading])

    if (!hasStorageAccess) {
        return (
            <div>
                {windowOpened
                    ? (
                        <>
                            <p>{NoAccessToStorageMessage}</p>
                            <button onClick={requestAccessToStorage}>
                                {AskForAccessButtonMessage}
                            </button>
                        </>
                    )
                    : (
                        <>
                            <p>{NoAbleToAskForStorageAccessMessage}</p>
                            <button onClick={openGrantPage}>
                                {AskForOpenWindowButtonMessage}
                            </button>
                        </>
                    )
                }
            </div>
        )
    }

    return (
        <OidcAuthContext.Provider value={value}>
            {
                (isAllLoaded && isAuthenticated && user.id === context.condoUserId)
                    ? children
                    : (errorReason === 'TIMEOUT_REACHED' && isAuthenticated)
                        ? <div><b>user={user.id}</b> <br/>Condo Bridge ERROR. Are you inside an iFrame? <br/><br/><small>{errorData}</small></div>
                        : <LoadingOrError showLoading />
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

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithOidcAuth.displayName = `withOidcAuth(${displayName})`
    }

    return WithOidcAuth
}

export { useOidcAuth, withOidcAuth }

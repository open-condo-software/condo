import get from 'lodash/get'
import isObject from 'lodash/isObject'
import getConfig from 'next/config'
import Router from 'next/router'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import bridge from '@open-condo/bridge'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'

import { useLaunchParams } from '@condo/domains/miniapp/hooks/useLaunchParams'

const {
    publicRuntimeConfig: { serverUrl },
} = getConfig()

interface IUseOidcAuthHookValue {
    user?: {
        id: string
        name: string
        isAdmin: boolean
        organizationId: string
    },
    isLoading?: boolean,
}

const OIDC_AUTH_URL = `${serverUrl || ''}/oidc/auth`

const OidcAuthContext = React.createContext<IUseOidcAuthHookValue>({})

const useOidcAuth = () => useContext(OidcAuthContext)

function getQueryValue (name) {
    if (typeof window === 'undefined' || !window.location) return undefined
    const urlSearchParams = new URLSearchParams(window.location.search)
    const params = Object.fromEntries(urlSearchParams.entries())
    return params[name]
}

const OidcAuthProvider = ({ children }) => {
    const intl = useIntl()
    const NoAccessToStorageMessage = intl.formatMessage({ id: 'NoAccessToStorage' })
    const AskForAccessButtonMessage = intl.formatMessage({ id: 'AskForAccessButton' })

    const { context, loading, error } = useLaunchParams()
    const errorReason = get(error, 'errorReason')
    const errorData = isObject(error) ? JSON.stringify(error) : '<NonObject>'
    const { user, isLoading: isUserLoading, isAuthenticated, refetch } = useAuth()
    const [authInProgress, setAuthInProgress] = useState(false)
    const [, setAuthError] = useState(false)

    /**
     * In the case of Safari we have to ask browser to grant access to condo's session cookie using Storage Access API
     * @link https://webkit.org/blog/8124/introducing-storage-access-api/
     */
    const [hasStorageAccess, setHasStorageAccess] = useState<boolean>(typeof document === 'undefined' || !document.hasStorageAccess || !document.requestStorageAccess)

    const isAllLoaded = !loading && !isUserLoading

    useEffect(() => {
        if (isAllLoaded && hasStorageAccess) {
            const hasNoRedirect = getQueryValue('noRedirect') === 'true'
            if (errorReason === 'TIMEOUT_REACHED' && isAuthenticated) {
                // we are not inside the iframe!
                console.debug('OidcAuthProvider: not inside iframe!', user, error)
                if (!hasNoRedirect) Router.push({
                    pathname: '/not-inside-iframe',
                    query: { userId: user.id, noRedirect: true },
                })
            } else if (!isAuthenticated || user.id !== context.condoUserId || user.organizationId !== context.condoContextEntityId) {
                console.debug('OidcAuthProvider: redirect to oidc auth', {
                    OIDC_AUTH_URL,
                    organizationId: context.condoContextEntityId,
                })
                if (!hasNoRedirect) {
                    setAuthInProgress(true)
                    setAuthError(false)
                    bridge.send('CondoWebAppRequestAuth', { url: OIDC_AUTH_URL }).then((data) => {
                        if (data.response.status === 200) {
                            // Process it in any way you like
                            console.debug(data.response)
                            refetch()
                            setAuthError(false)
                        } else {
                            setAuthError(true)
                        }
                    })
                        .catch((err) => {
                            console.debug(err)
                            setAuthError(true)
                        })
                        .finally(() => setAuthInProgress(false))
                }
            }
        }

    }, [
        isAllLoaded,
        user,
        isAuthenticated,
        hasStorageAccess,
        context.condoUserId, 
        context.condoContextEntityId,
        error,
        errorReason,
    ])

    useEffect(() => {
        if (!hasStorageAccess && typeof document !== 'undefined' && document.hasStorageAccess) {
            document.hasStorageAccess().then(
                (hasAccess) => {
                    // Boolean hasAccess says whether the document has access or not.
                    console.debug(`document.hasStorageAccess() resolved: ${hasAccess}`)
                    setHasStorageAccess(hasAccess)
                },
                (reason) => {
                    // Promise was rejected for some reason.
                    console.debug(`document.hasStorageAccess() rejected: ${reason}`)
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
                    console.debug('document.requestStorageAccess(): access granted')
                    setHasStorageAccess(true)
                },
                () => {
                    // Storage access was denied.
                    console.debug('document.requestStorageAccess(): access denied')
                    setHasStorageAccess(false)
                },
            )
        }
    }, [hasStorageAccess])

    if (!hasStorageAccess) {
        return (
            <div>
                <p>{NoAccessToStorageMessage}</p>
                <button
                    onClick={requestAccessToStorage}
                >
                    {AskForAccessButtonMessage}
                </button>
            </div>
        )
    }

    return (
        <OidcAuthContext.Provider value={{ user, isLoading: (isUserLoading || loading || authInProgress) }}>
            {
                (isAllLoaded && isAuthenticated && user.id === context.condoUserId)
                    ? children
                    : (errorReason === 'TIMEOUT_REACHED' && isAuthenticated)
                        ? <div><b>user={user.id}</b> <br/>Condo Bridge ERROR. Are you inside an iFrame? <br/><br/><small>{errorData}</small></div>
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

import React, { useCallback, useContext, useEffect, useState } from 'react'
import Router from 'next/router'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useLaunchParams } from '@condo/domains/miniapp/hooks/useLaunchParams'

interface IUseOidcAuthHookValue {
    user?: {
        id: string
        name: string
        isAdmin: boolean
        organizationId: string
    },
    isLoading?: boolean,
}

const OIDC_AUTH_URL = '/oidc/auth'

const OidcAuthContext = React.createContext<IUseOidcAuthHookValue>({})

const useOidcAuth = () => useContext(OidcAuthContext)

const OidcAuthProvider = ({ children }) => {
    const intl = useIntl()
    const NoAccessToStorageMessage = intl.formatMessage({ id: 'NoAccessToStorage' })
    const AskForAccessButtonMessage = intl.formatMessage({ id: 'AskForAccessButton' })

    const { context, loading } = useLaunchParams()
    const { user, isLoading: isUserLoading, isAuthenticated } = useAuth()

    /**
     * In the case of Safari we have to ask browser to grant access to condo's session cookie using Storage Access API
     * @link https://webkit.org/blog/8124/introducing-storage-access-api/
     */
    const [hasStorageAccess, setHasStorageAccess] = useState<boolean>(typeof document === 'undefined' || !document.hasStorageAccess || !document.requestStorageAccess)

    const isAllLoaded = !loading && !isUserLoading

    useEffect(() => {
        if (isAllLoaded && hasStorageAccess) {
            if (!isAuthenticated || user.id !== context.condoUserId || user.organizationId !== context.condoContextEntityId) {
                console.debug('OidcAuthProvider: redirect to oidc auth', {
                    OIDC_AUTH_URL,
                    organizationId: context.condoContextEntityId,
                })
                Router.push({
                    pathname: OIDC_AUTH_URL,
                    query: { organizationId: context.condoContextEntityId, condoUserId: context.condoUserId },
                })
            }
        }

    }, [isAllLoaded, user, isAuthenticated, hasStorageAccess, context.condoUserId, context.condoContextEntityId])

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
        <OidcAuthContext.Provider value={{ user, isLoading: (isUserLoading || loading) }}>
            {
                (isAllLoaded && isAuthenticated && user.id === context.condoUserId && user.organizationId === context.condoContextEntityId)
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

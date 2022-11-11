import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { createCondoBridge } from '@miniapp/domains/common/clients/CondoBridge'
import { useOrganization } from '@miniapp/domains/common/utils/organization'
import getConfig from 'next/config'
import Router from 'next/router'
import React, { useCallback, useContext, useEffect, useState } from 'react'

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
    const intl = useIntl()
    const NoAccessToStorageMessage = intl.formatMessage({ id: 'NoAccessToStorage' })
    const AskForAccessButtonMessage = intl.formatMessage({ id: 'AskForAccessButton' })

    const { organization: condoOrganization, isLoading: isOrganizationLoading } = useOrganization()
    const { result: condoUser, isLoading: isCondoUserLoading } = condoBridge.useUser()
    const { user, isLoading: isUserLoading, isAuthenticated } = useAuth()

    /**
     * In the case of Safari we have to ask browser to grant access to condo's session cookie using Storage Access API
     * @link https://webkit.org/blog/8124/introducing-storage-access-api/
     */
    const [hasStorageAccess, setHasStorageAccess] = useState<boolean>(!(!!document.hasStorageAccess && !!document.requestStorageAccess))

    const isAllLoaded = !isOrganizationLoading && !isCondoUserLoading && !isUserLoading

    useEffect(() => {
        if (isAllLoaded && hasStorageAccess) {
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

    }, [isAllLoaded, user, isAuthenticated, condoUser, condoOrganization, hasStorageAccess])

    useEffect(() => {
        if (!hasStorageAccess && document && document.hasStorageAccess) {
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
        if (!hasStorageAccess && document && document.requestStorageAccess) {
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

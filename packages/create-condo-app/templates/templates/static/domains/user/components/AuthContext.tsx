import getConfig from 'next/config'
import { OidcClient } from 'oidc-client-ts'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import bridge from '@open-condo/bridge'
import { Empty, Button, Spin } from '@open-condo/ui'

import { useLaunchParams } from '@/domains/common/components/LaunchParamsContext'
import { AUTH_TOKEN_KEY, AUTH_TOKEN_ISSUED_AT_KEY, AUTH_TOKEN_EXPIRATION_MARGIN_MS, AUTH_TOKEN_LIFETIME_MS } from '@/domains/user/constants/auth'

import type { AuthenticatedUserQuery } from '@/gql'

import { useAuthenticatedUserQuery } from '@/gql'

const { publicRuntimeConfig: { condoDomain, oidcClientId } } = getConfig()

const client = new OidcClient({
    authority: `${condoDomain}/oidc/`,
    client_id: oidcClientId,
    redirect_uri: '',
    response_type: 'code',
    scope: 'openid',
})


type UserType = AuthenticatedUserQuery['authenticatedUser']

type AuthContextType = {
    loading: boolean
    user: UserType | null
}

const AuthContext = createContext<AuthContextType>({
    loading: true,
    user: null,
})

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const intl = useIntl()
    const AuthErrorMessage = intl.formatMessage({ id: 'global.common.errors.serverError.message' })
    const AuthErrorDescription = intl.formatMessage({ id: 'components.user.authContext.errors.authError.description' })
    const RetryButtonLabel = intl.formatMessage({ id: 'components.user.authContext.actions.retry.label' })

    const [isOIDCLoading, setIsOIDCLoading] = useState(false)
    const { persistor } = useCachePersistor()
    const { launchParams, loading: launchParamsLoading } = useLaunchParams()
    const [isError, setIsError] = useState(false)

    const { loading: userLoading, data, refetch } = useAuthenticatedUserQuery({
        skip: !persistor,
    })

    const signIn = useCallback(async () => {
        const authRequest = await client.createSigninRequest({
            redirect_uri: new URL(window.location.href).origin,
        })

        const { response } = await bridge.send('CondoWebAppRequestAuth', { url: authRequest.url })
        if (response.status !== 200) {
            throw new Error('Failed to authenticate via Condo Bridge')
        }
        const { access_token } = await client.processSigninResponse(response.url)
        window.localStorage.setItem(AUTH_TOKEN_KEY, access_token)
        window.localStorage.setItem(AUTH_TOKEN_ISSUED_AT_KEY, String(Date.now()))
        void refetch()
    }, [refetch])

    const loading = useMemo(() => {
        return launchParamsLoading || userLoading || !persistor || isOIDCLoading
    }, [launchParamsLoading, userLoading, persistor, isOIDCLoading])

    const value = useMemo(() => {
        const fetchedUser = data?.authenticatedUser
        const user = fetchedUser?.id && launchParams?.condoUserId && fetchedUser.id !== launchParams.condoUserId ? null : fetchedUser

        return {
            loading,
            user,
        }
    }, [data?.authenticatedUser, launchParams?.condoUserId, loading])

    useEffect(() => {
        // skip if loading
        if (userLoading || launchParamsLoading) {
            return
        }

        // if auth token is close to expiry, refresh
        const authTokenIssuedAt = window.localStorage.getItem(AUTH_TOKEN_ISSUED_AT_KEY)
        const isTokenCloseToExpiry =
            !authTokenIssuedAt ||
            Number.isNaN(Number(authTokenIssuedAt)) ||
            (Number(authTokenIssuedAt) + AUTH_TOKEN_LIFETIME_MS - Date.now()) < AUTH_TOKEN_EXPIRATION_MARGIN_MS

        const isUserDiffers =
            !data?.authenticatedUser ||
            (launchParams?.condoUserId && data.authenticatedUser.id !== launchParams.condoUserId)


        if (isTokenCloseToExpiry || isUserDiffers) {
            setIsOIDCLoading(true)
            signIn().catch((err) => {
                console.error(err)
                setIsError(true)
            }).finally(() => {
                setIsOIDCLoading(false)
            })
        }
    }, [data?.authenticatedUser, launchParams?.condoUserId, launchParamsLoading, signIn, userLoading])

    const content = useMemo(() => {
        if (isError) {
            const onRetry = () => {
                window.location.reload()
            }

            return (
                <Empty
                    image='/mascot/fail.webp'
                    title={AuthErrorMessage}
                    description={AuthErrorDescription}
                    action={<Button type='primary' onClick={onRetry}>{RetryButtonLabel}</Button>}
                />
            )
        }

        if (loading) {
            return <Spin size='large' block/>
        }

        return children
    }, [AuthErrorDescription, AuthErrorMessage, RetryButtonLabel, children, isError, loading])

    return (
        <AuthContext.Provider value={value}>
            {content}
        </AuthContext.Provider>
    )
}

export function useAuth () {
    return React.useContext(AuthContext)
}
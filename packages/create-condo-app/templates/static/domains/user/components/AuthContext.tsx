import getConfig from 'next/config'
import { OidcClient } from 'oidc-client-ts'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import bridge from '@open-condo/bridge'

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
    const [isOIDCLoading, setIsOIDCLoading] = useState(false)
    const { persistor } = useCachePersistor()
    const { launchParams, loading: launchParamsLoading } = useLaunchParams()

    const { loading: userLoading, data, refetch } = useAuthenticatedUserQuery({
        skip: !persistor,
    })

    const signIn = useCallback(async () => {
        setIsOIDCLoading(true)
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
        setIsOIDCLoading(false)
        void refetch()
    }, [refetch])

    const value = useMemo(() => {
        const loading = launchParamsLoading || userLoading || !persistor || isOIDCLoading
        const fetchedUser = data?.authenticatedUser
        const user = fetchedUser?.id && launchParams?.condoUserId && fetchedUser.id !== launchParams.condoUserId ? null : fetchedUser

        return {
            loading,
            user,
        }
    }, [data?.authenticatedUser, isOIDCLoading, launchParams?.condoUserId, launchParamsLoading, persistor, userLoading])

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
            void signIn()
        }
    }, [data?.authenticatedUser, launchParams?.condoUserId, launchParamsLoading, signIn, userLoading])

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth () {
    return React.useContext(AuthContext)
}
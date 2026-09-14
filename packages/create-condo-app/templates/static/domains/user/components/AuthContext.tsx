import getConfig from 'next/config'
import { OidcClient } from 'oidc-client-ts'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import bridge from '@open-condo/bridge'

import { useLaunchParams } from '@/domains/common/components/LaunchParamsContext'
import { AUTH_TOKEN_KEY } from '@/domains/user/constants/auth'

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
        if (
            !userLoading &&
            !launchParamsLoading &&
            (
                !data?.authenticatedUser ||
                (launchParams?.condoUserId && data.authenticatedUser.id !== launchParams.condoUserId)
            )
        ) {
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
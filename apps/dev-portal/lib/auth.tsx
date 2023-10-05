import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import get from 'lodash/get'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { useApolloClient } from '@/lib/apollo'
import {
    AuthenticatedUserDocument,
    useAuthenticatedUserQuery,
    AuthenticatedUserQuery,
    useSignInMutation,
    useSignOutMutation,
} from '@/lib/gql'


const AUTH_COOKIE_KEY = 'keystone.sid'

type HeadersType = Record<string, string>

type AuthenticatedUserType = AuthenticatedUserQuery['authenticatedUser']

type AuthContextType = {
    isAuthenticated: boolean
    isLoading: boolean
    user: AuthenticatedUserType | null
    signIn: (identity: string, password: string) => void
    signOut: () => void
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    signIn: () => ({}),
    signOut: () => ({}),
})

export const AuthProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const apolloClient = useApolloClient()
    const { data: auth, loading: userLoading, refetch } = useAuthenticatedUserQuery()

    const [user, setUser] = useState<AuthenticatedUserType>(get(auth, 'authenticatedUser', null))

    const [signInMutation, { loading: signInLoading }] = useSignInMutation({
        onCompleted: async () => {
            await apolloClient.clearStore()
            await refetch()
        },
        onError: (error) => {
            console.error(error)
            setUser(null)
        },
    })
    const [signOutMutation, { loading: signOutLoading }] = useSignOutMutation({
        onCompleted: async (data) => {
            const success = get(data, ['unauthenticateUser', 'success'])
            if (success) {
                setUser(null)
            }
            await apolloClient.clearStore()
            await refetch()
        },
        onError: (error) => {
            console.error(error)
        },
    })
    
    useEffect(() => {
        if (!userLoading) {
            setUser(get(auth, 'authenticatedUser', null))
        }
    }, [userLoading, auth])

    const signIn = useCallback((phone: string, password: string) => {
        signInMutation({
            variables: {
                phone,
                password,
            },
        })
    }, [signInMutation])

    const signOut = useCallback(() => {
        signOutMutation()
    }, [signOutMutation])

    return (
        <AuthContext.Provider
            value={{
                isLoading: userLoading || signInLoading || signOutLoading,
                isAuthenticated: !!user,
                user,
                signIn,
                signOut,
            }}
            children={children}
        />
    )
}

export const useAuth = (): AuthContextType => useContext(AuthContext)

/**
 * Extracts authorization token from request inside getServerSideProps
 * and generates Authorization headers to be used in data prefetching
 *
 * @param {{ cookies: Record<string, string> }} req - request object obtained from getServerSideProps
 * @example
 * ```typescript
 * async function getServerSideProps ({ req }) {
 *      const client = initializeApollo
 *      const headers = extractAuthHeadersFromRequest(req)
 *      await clint.query(PAGE_RELATED_QUERY, {
 *          context: { headers }
 *      })
 *
 *      return extractApolloState(client, {
 *         props: {
 *             myPageProp: 123
 *         }
 *     })
 * }
 * ```
 */
export function extractAuthHeadersFromRequest (req: { cookies: Record<string, string> }): HeadersType {
    const ssid = get(req.cookies, AUTH_COOKIE_KEY, null)
    if (!ssid) {
        return {}
    }

    return {
        Authorization: `Bearer ${ssid.substring(2)}`,
    }
}

/**
 * Prefetches user auth in getServerSideProps
 * @param {ApolloClient<NormalizedCacheObject>} client - apollo client
 * @param {{ headers?: HeadersType }} opts - additional options, like headers and etc
 */
export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>, opts: { headers?: HeadersType } = {}): Promise<void> {
    await client.query({
        query: AuthenticatedUserDocument,
        context: {
            headers: opts.headers,
        },
    })
}
import { gql, ApolloClient, NormalizedCacheObject } from '@apollo/client'
import get from 'lodash/get'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { useMutation, useQuery, useApolloClient } from '@/lib/apollo'

const AUTH_COOKIE_KEY = 'keystone.sid'

const USER_QUERY = gql`
    query {
        authenticatedUser {
            id
            name
            phone
            isAdmin
            isSupport
        }
    }
`

const SIGN_IN_MUTATION = gql`
    mutation signIn($phone: String!, $password: String!) {
        authenticateUserWithPhoneAndPassword(data: { 
            phone: $phone,
            password: $password
        }) {
            item {
              id
            }
        }
    }
`

const SIGN_OUT_MUTATION = gql`
    mutation signOut {
    unauthenticateUser {
        success
    }
}
`

type HeadersType = Record<string, string>

type AuthenticatedUserType = {
    id: string
    name: string
    phone: string
    isAdmin: boolean
    isSupport: boolean
}

type UserQueryResponseType = {
    authenticatedUser?: AuthenticatedUserType | null
}

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
    const { data: auth, loading: userLoading, refetch } = useQuery<UserQueryResponseType>(USER_QUERY)

    const [user, setUser] = useState<AuthenticatedUserType>(get(auth, 'authenticatedUser', null))

    const [signInMutation, { loading: signInLoading }] = useMutation(SIGN_IN_MUTATION, {
        onCompleted: async () => {
            await apolloClient.clearStore()
            await refetch()
        },
        onError: (error) => {
            console.error(error)
            setUser(null)
        },
    })
    const [signOutMutation, { loading: signOutLoading }] = useMutation(SIGN_OUT_MUTATION, {
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
        query: USER_QUERY,
        context: {
            headers: opts.headers,
        },
    })
}
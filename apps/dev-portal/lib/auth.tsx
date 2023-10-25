import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import get from 'lodash/get'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { Modal } from '@open-condo/ui'

import { AuthForm } from '@/domains/common/components/auth/AuthForm'

import { useApolloClient } from '@/lib/apollo'
import {
    AuthenticatedUserDocument,
    useAuthenticatedUserQuery,
    AuthenticatedUserQuery,
    useSignOutMutation,
} from '@/lib/gql'


const AUTH_COOKIE_KEY = 'keystone.sid'

type HeadersType = Record<string, string>

type AuthenticatedUserType = AuthenticatedUserQuery['authenticatedUser']

type AuthContextType = {
    isAuthenticated: boolean
    isLoading: boolean
    user: AuthenticatedUserType | null
    signOut: () => void
    refetchAuth: () => Promise<void>
    startSignIn: () => void
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    signOut: () => ({}),
    refetchAuth: () => Promise.resolve(),
    startSignIn: () => ({}),
})

export const AuthProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const apolloClient = useApolloClient()
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const { data: auth, loading: userLoading, refetch } = useAuthenticatedUserQuery()

    const [user, setUser] = useState<AuthenticatedUserType>(get(auth, 'authenticatedUser', null))

    const refetchAuth = useCallback(async () => {
        await apolloClient.clearStore()
        await refetch()
    }, [apolloClient, refetch])

    const [signOutMutation, { loading: signOutLoading }] = useSignOutMutation({
        onCompleted: async (data) => {
            const success = get(data, ['unauthenticateUser', 'success'])
            if (success) {
                setUser(null)
            }
            await refetchAuth()
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

    const signOut = useCallback(() => {
        signOutMutation()
    }, [signOutMutation])

    const handleModalClose = useCallback(() => {
        setAuthModalOpen(false)
    }, [])

    const handleAuthComplete = useCallback(() => {
        refetchAuth().then(handleModalClose)
    }, [refetchAuth, handleModalClose])

    const startSignIn = useCallback(() => {
        setAuthModalOpen(true)
    }, [])

    return (
        <AuthContext.Provider
            value={{
                isLoading: userLoading || signOutLoading,
                isAuthenticated: !!user,
                user,
                signOut,
                refetchAuth,
                startSignIn,
            }}
        >
            {children}
            {authModalOpen && (
                <Modal
                    open={authModalOpen}
                    onCancel={handleModalClose}
                >
                    <AuthForm onComplete={handleAuthComplete}/>
                </Modal>
            )}
        </AuthContext.Provider>
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
export function extractAuthHeadersFromRequest (req: { cookies: Partial<Record<string, string>> }): HeadersType {
    const ssid = get(req, ['cookies', AUTH_COOKIE_KEY], null)
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
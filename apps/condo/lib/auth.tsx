// import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'

import { ApolloClient, NormalizedCacheObject, useApolloClient } from '@apollo/client'
import cookie from 'js-cookie'
import get from 'lodash/get'
import { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { AuthenticatedUserQuery, AuthenticatedUserDocument, useAuthenticatedUserQuery, useSignOutMutation } from '@/gql'



type AuthenticatedUserType = AuthenticatedUserQuery['authenticatedUser']


type AuthContextType = {
    isAuthenticated: boolean
    isLoading: boolean
    refetch: () => Promise<void>
    /** @deprecated TODO(INFRA-517): should be removed */
    signin?: () => void
    /** @deprecated TODO(INFRA-517): rename to signOut */
    signout: () => void
    user?: AuthenticatedUserType | null
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: false,
    refetch: () => Promise.resolve(),
    signin: () => ({}),
    signout: () => ({}),
    user: null,
})

export const useAuth = (): AuthContextType => useContext(AuthContext)

export const withAuth = () => (PageComponent: NextPage): NextPage => {
    const WithAuth = (props) => {
        return (
            <AuthProvider>
                <PageComponent {...props} />
            </AuthProvider>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName =
            PageComponent.displayName || PageComponent.name || 'Component'
        WithAuth.displayName = `WithAuth(${displayName})`
    }

    WithAuth.getInitialProps = PageComponent.getInitialProps

    return WithAuth
}


export const AuthProvider: React.FC = ({ children }) => {
    const apolloClient = useApolloClient()
    const router = useRouter()

    const {
        data: authenticatedUser,
        loading: userLoading,
        refetch,
    } = useAuthenticatedUserQuery()

    const [user, setUser] = useState<AuthenticatedUserType>(get(authenticatedUser, 'authenticatedUser', null))

    const refetchAuth = useCallback(async () => {
        // if (withClearStore) await apolloClient.clearStore()
        await refetch()
    }, [refetch])

    const [signOutMutation, { loading: signOutLoading }] = useSignOutMutation({
        onCompleted: async (data) => {
            const success = get(data, ['unauthenticateUser', 'success'])
            if (success) setUser(null)

            cookie.remove('organizationLinkId')
            await apolloClient.clearStore()
            await router.push('/')
        },
        onError: (error) => {
            console.error(error)
        },
    })

    useEffect(() => {
        if (!userLoading) {
            setUser(get(authenticatedUser, 'authenticatedUser', null))
        }
    }, [authenticatedUser, userLoading])

    const signOut = useCallback(async () => {
        await signOutMutation()
    }, [signOutMutation])

    console.log('AuthProvider::: >>>', {
        isLoading: userLoading || signOutLoading,
        isAuthenticated: !!user,
        user,
    })

    return (
        <AuthContext.Provider
            value={{
                isLoading: userLoading || signOutLoading,
                isAuthenticated: !!user,
                user,
                refetch: refetchAuth,
                signout: signOut,
            }}
            children={children}
        />
    )
}

export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>) {
    const response = await client.query<AuthenticatedUserQuery>({
        query: AuthenticatedUserDocument,
    })

    return response.data.authenticatedUser
}

export async function prefetchAuthOrRedirect (client: ApolloClient<NormalizedCacheObject>, context: Parameters<GetServerSideProps>[0]) {
    const result: { user: Awaited<ReturnType<typeof prefetchAuth>> | null, redirect: null | Awaited<ReturnType<GetServerSideProps>> } = { user: null, redirect: null }
    const user = await prefetchAuth(client)

    console.log('prefetchAuthOrRedirect::: >>>', { user })

    if (user) {
        result.user = user
    } else {
        const { resolvedUrl } = context
        result.redirect = {
            unstable_redirect: {
                destination: `/auth/signin?next=${encodeURIComponent(resolvedUrl)}`,
                permanent: false,
            },
        }
    }

    return result
}

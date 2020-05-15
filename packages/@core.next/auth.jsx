import React, { createContext, useContext, useState } from 'react'
import { useQuery, useMutation, useApolloClient } from './apollo'
import gql from 'graphql-tag'

const { preventInfinityLoop, getContextIndependentWrappedInitialProps } = require('./_utils')

/**
 * AuthContext
 * -----------
 * This is the base react context instance. It should not be used
 * directly but is exported here to simplify testing.
 */
const AuthContext = createContext({
    isAuthenticated: false,
    isLoading: true,
    signin: () => {throw new Error('no Auth.signin')},
    signout: () => {throw new Error('no Auth.signin')},
    user: {},
})

/**
 * useAuth
 * -------
 * A hook which provides access to the AuthContext
 */
const useAuth = () => useContext(AuthContext)

const userFragment = `
  id
  name
  avatar {
    publicUrl
  }
  isAdmin
`

let USER_QUERY = gql`
    query {
        authenticatedUser {
            ${userFragment}
        }
    }
`

let SIGNIN_MUTATION = gql`
    mutation signin($email: String, $password: String) {
        authenticateUserWithPassword(email: $email, password: $password) {
            item {
                ${userFragment}
            }
        }
    }
`

let SIGNOUT_MUTATION = gql`
    mutation {
        unauthenticateUser {
            success
        }
    }
`

/**
 * AuthProvider
 * ------------
 * AuthProvider is a component which keeps track of the user's
 * authenticated state and provides methods for managing the auth state.
 */
const AuthProvider = ({ children, initialUserValue }) => {
    const [user, setUser] = useState(initialUserValue)
    const client = useApolloClient()

    const { loading: userLoading } = useQuery(USER_QUERY, {
        fetchPolicy: 'no-cache',
        onCompleted: ({ authenticatedUser, error }) => {
            if (error) {
                throw error
            }

            setUser(authenticatedUser)
        },
        onError: console.error,
    })

    const [signin, { loading: signinLoading }] = useMutation(SIGNIN_MUTATION, {
        onCompleted: async ({ authenticateUserWithPassword: { item } = {}, error }) => {
            if (error) {
                throw error
            }

            // Ensure there's no old unauthenticated data hanging around
            await client.resetStore()

            if (item) {
                setUser(item)
            }
        },
    })

    const [signout, { loading: signoutLoading }] = useMutation(SIGNOUT_MUTATION, {
        onCompleted: async ({ unauthenticateUser: { success } = {}, error }) => {
            if (error) {
                throw error
            }

            // Ensure there's no old authenticated data hanging around
            await client.resetStore()

            if (success) {
                setUser(null)
            }
        },
    })

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!user,
                isLoading: userLoading || signinLoading || signoutLoading,
                signin,
                signout,
                user,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

const withAuth = ({ ssr = false, ...opts } = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    USER_QUERY = opts.USER_QUERY ? opts.USER_QUERY : USER_QUERY
    SIGNIN_MUTATION = opts.SIGNIN_MUTATION ? opts.SIGNIN_MUTATION : SIGNIN_MUTATION
    SIGNOUT_MUTATION = opts.SIGNOUT_MUTATION ? opts.SIGNOUT_MUTATION : SIGNOUT_MUTATION

    const WithAuth = ({ user, ...pageProps }) => {
        return (
            <AuthProvider initialUserValue={user}>
                <PageComponent {...pageProps} />
            </AuthProvider>
        )
    }

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithAuth.displayName = `withAuth(${displayName})`
    }

    if (ssr || PageComponent.getInitialProps) {
        WithAuth.getInitialProps = async ctx => {
            const isOnServerSide = typeof window === 'undefined'
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            let user
            if (isOnServerSide) {
                try {
                    const data = await ctx.apolloClient.query({
                        query: USER_QUERY,
                        fetchPolicy: 'network-only',
                    })
                    user = data.data ? data.data.authenticatedUser : undefined
                } catch (error) {
                    // Prevent Apollo Client GraphQL errors from crashing SSR.
                    // Handle them in components via the data.error prop:
                    // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
                    console.error('Error while running `withAuth`', error)
                }
            }

            preventInfinityLoop(ctx)

            return {
                ...pageProps,
                user,
            }
        }
    }

    return WithAuth
}

export {
    withAuth,
    useAuth,
}

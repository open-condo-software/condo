import React, { createContext, useContext, useEffect, useState } from 'react'
import { useApolloClient, useMutation, useQuery } from './apollo'
import gql from 'graphql-tag'

const { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } = require('./_utils')

/**
 * AuthContext
 * -----------
 * This is the base react context instance. It should not be used
 * directly but is exported here to simplify testing.
 */
const AuthContext = createContext({})

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
    const client = useApolloClient()
    const [user, setUser] = useState(initialUserValue)

    const { data: userData, loading: userLoading, error: userError, refetch } = useQuery(USER_QUERY)

    useEffect(() => {
        if (userData) onData(userData)
        if (userError) onError(userError)
    }, [userData, userError])

    const [signin, { loading: signinLoading }] = useMutation(SIGNIN_MUTATION, {
        onCompleted: async ({ authenticateUserWithPassword: { item } = {}, error }) => {
            if (error) { return onError(error) }
            if (DEBUG_RERENDERS) console.log('AuthProvider() signin()')

            if (item) {
                setUser(item)
            }

            // Ensure there's no old unauthenticated data hanging around
            await client.resetStore()
        },
    })

    const [signout, { loading: signoutLoading }] = useMutation(SIGNOUT_MUTATION, {
        onCompleted: async ({ unauthenticateUser: { success } = {}, error }) => {
            if (error) { return onError(error) }
            if (DEBUG_RERENDERS) console.log('AuthProvider() signout()')

            if (success) {
                setUser(null)
            }

            // Ensure there's no old authenticated data hanging around
            await client.resetStore()
        },
    })

    function onError (error) {
        console.warn('auth.onError(..)', error)
        if (user) setUser(null)
    }

    function onData (data) {
        if (data && data.error) { return onError(data.error) }
        if (!data || !data.authenticatedUser) {
            console.warn('Unexpected auth.onData(..) call', data)
            return
        }
        if (JSON.stringify(data.authenticatedUser) === JSON.stringify(user)) return
        if (DEBUG_RERENDERS) console.log('AuthProvider() newUser', data.authenticatedUser)
        setUser(data.authenticatedUser)
    }

    if (DEBUG_RERENDERS) console.log('AuthProvider()', user)

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!user,
                isLoading: userLoading || signinLoading || signoutLoading,
                refetch,
                signin,
                signout,
                user,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) AuthProvider.whyDidYouRender = true

const initOnRestore = async (ctx) => {
    let user
    const isOnServerSide = typeof window === 'undefined'
    try {
        const data = await ctx.apolloClient.query({
            query: USER_QUERY,
            fetchPolicy: (isOnServerSide) ? 'network-only' : 'cache-first',
        })
        user = data.data ? data.data.authenticatedUser : undefined
    } catch (error) {
        // Prevent Apollo Client GraphQL errors from crashing SSR.
        // Handle them in components via the data.error prop:
        // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
        console.error('Error while running `withAuth`', error)
        user = null
    }
    return { user }
}

const withAuth = ({ ssr = false, ...opts } = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    USER_QUERY = opts.USER_QUERY ? opts.USER_QUERY : USER_QUERY
    SIGNIN_MUTATION = opts.SIGNIN_MUTATION ? opts.SIGNIN_MUTATION : SIGNIN_MUTATION
    SIGNOUT_MUTATION = opts.SIGNOUT_MUTATION ? opts.SIGNOUT_MUTATION : SIGNOUT_MUTATION

    const WithAuth = ({ user, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithAuth()', user)
        return (
            <AuthProvider initialUserValue={user}>
                <PageComponent {...pageProps} />
            </AuthProvider>
        )
    }

    if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) WithAuth.whyDidYouRender = true

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithAuth.displayName = `withAuth(${displayName})`
    }

    if (ssr || PageComponent.getInitialProps) {
        WithAuth.getInitialProps = async ctx => {
            if (DEBUG_RERENDERS) console.log('WithAuth.getInitialProps()', ctx)
            const isOnServerSide = typeof window === 'undefined'
            const { user } = await initOnRestore(ctx)
            const pageProps = await getContextIndependentWrappedInitialProps(PageComponent, ctx)

            if (isOnServerSide) {
                preventInfinityLoop(ctx)
            }

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

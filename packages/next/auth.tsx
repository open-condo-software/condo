import { DocumentNode } from 'graphql'
import { gql } from 'graphql-tag'
import get from 'lodash/get'
import { NextPage } from 'next'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

import { isSSR } from '@open-condo/miniapp-utils'

import { DEBUG_RERENDERS, DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER, preventInfinityLoop, getContextIndependentWrappedInitialProps } from './_utils'
import { useApolloClient, useMutation, useQuery } from './apollo'
import { removeCookieEmployeeId } from './organization'
import { Either } from './types'


// NOTE: OpenCondoNext is defined as a global namespace so the library user can override the default types
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace OpenCondoNext {
        interface UserType {}
    }
}

type UserType = keyof OpenCondoNext.UserType extends never
    ? any
    : OpenCondoNext.UserType

type IAuthContext = {
    isAuthenticated: boolean
    isLoading: boolean
    refetch: () => Promise<void>
    signIn: ReturnType<typeof useMutation>[0]
    signOut: ReturnType<typeof useMutation>[0]
    user?: UserType | null
}
/**
 * AuthContext
 * -----------
 * This is the base react context instance. It should not be used
 * directly but is exported here to simplify testing.
 */
const AuthContext = createContext<IAuthContext>({
    isAuthenticated: false,
    isLoading: false,
    refetch: () => Promise.resolve(),
    signIn: () => Promise.resolve({}),
    signOut: () => Promise.resolve({}),
})

/**
 * useAuth
 * -------
 * A hook which provides access to the AuthContext
 */
const useAuth = (): IAuthContext => useContext(AuthContext)

const userFragment = `
  id
  name
  avatar {
    publicUrl
  }
  phone
  email
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
    mutation signIn($email: String, $password: String) {
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

/** @deprecated */
const AuthProviderLegacy = ({ children, initialUserValue }) => {
    const client = useApolloClient()
    const [user, setUser] = useState(initialUserValue)

    const { data: userData, loading: userLoading, error: userError, refetch } = useQuery(USER_QUERY)

    const [isUserLoading, setIsUserLoading] = useState(userLoading)

    useEffect(() => {
        if (userData) onData(userData)
        if (userError) onError(userError)
    }, [userData, userError])

    useEffect(() => {
        setIsUserLoading(userLoading)
    }, [userLoading])

    const [signIn, { loading: signinLoading }] = useMutation(SIGNIN_MUTATION, {
        onCompleted: async (data) => {
            const error = get(data, 'error')
            const item = get(data, 'authenticateUserWithPassword.item')

            if (error) { return onError(error) }
            if (DEBUG_RERENDERS) console.log('AuthProviderLegacy() signIn()')

            if (item) {
                await client.clearStore()

                setUser(item)
            }
        },
    })

    const [signOut, { loading: signoutLoading }] = useMutation(SIGNOUT_MUTATION, {
        onCompleted: async (data) => {
            const error = get(data, 'error')
            const success = get(data, 'unauthenticateUser.success')

            if (error) { return onError(error) }
            if (DEBUG_RERENDERS) console.log('AuthProviderLegacy() signOut()')
            removeCookieEmployeeId()
            if (success) {
                setUser(null)
            }

            // Ensure there's no old authenticated data hanging around
            await client.clearStore()
        },
    })

    const onError = (error) => {
        console.warn('auth.onError(..)', error)
        if (user) setUser(null)
    }

    const onData = (data) => {
        if (data && data.error) { return onError(data.error) }
        if (!data || !data.authenticatedUser) {
            console.warn('Unexpected auth.onData(..) call', data)
            return
        }
        if (JSON.stringify(data.authenticatedUser) === JSON.stringify(user)) return
        if (DEBUG_RERENDERS) console.log('AuthProviderLegacy() newUser', data.authenticatedUser)
        setUser(data.authenticatedUser)
    }

    const refetchUserData = () => refetch().then(({ data }) => {
        onData(data)
    })

    if (DEBUG_RERENDERS) console.log('AuthProviderLegacy()', user)

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!user,
                isLoading: isUserLoading || signinLoading || signoutLoading,
                refetch: refetchUserData,
                signIn,
                signOut,
                user,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) AuthProviderLegacy.whyDidYouRender = true

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

type WithAuthLegacyProps = {
    ssr?: boolean
    USER_QUERY?: DocumentNode
    SIGNIN_MUTATION?: DocumentNode
    SIGNOUT_MUTATION?: DocumentNode
}
type WithAuthLegacyType = (props: WithAuthLegacyProps) => (PageComponent: NextPage) => NextPage

/** @deprecated */
const _withAuthLegacy: WithAuthLegacyType = ({ ssr = false, ...opts } = {}) => PageComponent => {
    // TODO(pahaz): refactor it. No need to patch globals here!
    USER_QUERY = opts.USER_QUERY ? opts.USER_QUERY : USER_QUERY
    SIGNIN_MUTATION = opts.SIGNIN_MUTATION ? opts.SIGNIN_MUTATION : SIGNIN_MUTATION
    SIGNOUT_MUTATION = opts.SIGNOUT_MUTATION ? opts.SIGNOUT_MUTATION : SIGNOUT_MUTATION

    const WithAuth = ({ user, ...pageProps }) => {
        if (DEBUG_RERENDERS) console.log('WithAuth()', user)
        return (
            <AuthProviderLegacy initialUserValue={user}>
                <PageComponent {...pageProps} />
            </AuthProviderLegacy>
        )
    }

    if (DEBUG_RERENDERS_BY_WHY_DID_YOU_RENDER) WithAuth.whyDidYouRender = true

    // Set the correct displayName in development
    if (process.env.NODE_ENV !== 'production') {
        const displayName = PageComponent.displayName || PageComponent.name || 'Component'
        WithAuth.displayName = `withAuth(${displayName})`
    }

    if (ssr || !isSSR() || PageComponent.getInitialProps) {
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


/**
 * AuthProvider
 * ------------
 * AuthProvider is a component which keeps track of the user's
 * authenticated state and provides methods for managing the auth state.
 */
const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const apolloClient = useApolloClient()
    const cachedUser = apolloClient.cache.readQuery<{ authenticatedUser: UserType }>({
        query: USER_QUERY,
    })?.authenticatedUser ?? null

    const [user, setUser] = useState<UserType | null>(cachedUser)
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false)

    const { loading: userLoading, refetch } = useQuery(USER_QUERY, {
        onCompleted: (data) => {
            setUser(data.authenticatedUser)
            setIsAuthLoading(false)
        },
        onError: (error) => {
            console.error(error)
            setUser(null)
            setIsAuthLoading(false)
        },
    })

    const refetchAuth = useCallback(async () => {
        const { data } = await refetch()
        setUser(data?.authenticatedUser || null)
    }, [refetch])

    const [signInMutation, { loading: signInLoading }] = useMutation(SIGNIN_MUTATION, {
        onCompleted: async (data) => {
            const item = get(data, 'authenticateUserWithPassword.item')

            if (DEBUG_RERENDERS) console.log('AuthProviderLegacy() signIn()')

            if (item) {
                setUser(item)
                await apolloClient.clearStore()
            }
            setIsAuthLoading(false)
        },
        onError: (error) => {
            console.error(error)
            setUser(null)
            setIsAuthLoading(false)
        },
    })

    const [signOutMutation, { loading: signOutLoading }] = useMutation(SIGNOUT_MUTATION, {
        onCompleted: async () => {
            await apolloClient.cache.reset()
            apolloClient.cache.writeQuery({
                query: USER_QUERY,
                data: {
                    authenticatedUser: null,
                },
            })
            setUser(null)
            setIsAuthLoading(false)
        },
        onError: (error) => {
            console.error(error)
            setUser(null)
            setIsAuthLoading(false)
        },
    })

    useEffect(() => {
        if (userLoading || signOutLoading || signInLoading) {
            setIsAuthLoading(true)
        }
    }, [userLoading, signOutLoading, signInLoading])

    return (
        <AuthContext.Provider
            value={{
                isLoading: isAuthLoading,
                isAuthenticated: !!user,
                user,
                refetch: refetchAuth,
                signIn: signInMutation,
                signOut: signOutMutation,
            }}
            children={children}
        />
    )
}


type WithAuthProps = {
    USER_QUERY?: DocumentNode
    SIGNIN_MUTATION?: DocumentNode
    SIGNOUT_MUTATION?: DocumentNode
}
type WithAuthType = (props: WithAuthProps) => (PageComponent: NextPage) => NextPage

const _withAuth: WithAuthType = (opts) => (PageComponent: NextPage): NextPage => {
    USER_QUERY = opts.USER_QUERY ? opts.USER_QUERY : USER_QUERY
    SIGNIN_MUTATION = opts.SIGNIN_MUTATION ? opts.SIGNIN_MUTATION : SIGNIN_MUTATION
    SIGNOUT_MUTATION = opts.SIGNOUT_MUTATION ? opts.SIGNOUT_MUTATION : SIGNOUT_MUTATION

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

type mergedWithAuthProps = Either<WithAuthProps & { legacy: false }, WithAuthLegacyProps & { legacy?: true }>
type mergedWithAuthType = (props: mergedWithAuthProps) => (PageComponent: NextPage) => NextPage
const withAuth: mergedWithAuthType = (opts) => (PageComponent: NextPage): NextPage => {
    if (opts.legacy === false) {
        return _withAuth(opts)(PageComponent)
    } else {
        return _withAuthLegacy(opts)(PageComponent)
    }
}

export {
    withAuth,
    useAuth,
}

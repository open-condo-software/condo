import { gql, ApolloClient, NormalizedCacheObject } from '@apollo/client'
import get from 'lodash/get'
import React, { createContext, useContext } from 'react'

import { useQuery } from '@/lib/apollo'

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
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
})

export const AuthProvider: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { data: auth, loading: userLoading } = useQuery<UserQueryResponseType>(USER_QUERY)

    const user = get(auth, 'authenticatedUser')

    return (
        <AuthContext.Provider
            value={{
                isLoading: userLoading,
                isAuthenticated: !!user,
                user,
            }}
            children={children}
        />
    )
}

export const useAuth = (): AuthContextType => useContext(AuthContext)

/**
 * Prefetches user auth in getServerSideProps
 * @param {ApolloClient<NormalizedCacheObject>} client - apollo client
 */
export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>): Promise<void> {
    await client.query({
        query: USER_QUERY,
    })
}
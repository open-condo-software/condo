// This file is autogenerated by @graphql-codegen/cli
// Do not edit / add anything manually, since it will be overridden by codegen


import { gql } from '@apollo/client'
import * as Apollo from '@apollo/client'

import * as Types from '@/gql/operation.types'

export * from '@/gql/operation.types'

const defaultOptions = {} as const

export const AuthenticatedUserDocument = gql`
    query authenticatedUser {
  authenticatedUser {
    id
    name
    type
  }
}
    `

/**
 * __useAuthenticatedUserQuery__
 *
 * To run a query within a React component, call `useAuthenticatedUserQuery` and pass it any options that fit your needs.
 * When your component renders, `useAuthenticatedUserQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAuthenticatedUserQuery({
 *   variables: {
 *   },
 * });
 */
export function useAuthenticatedUserQuery (baseOptions?: Apollo.QueryHookOptions<Types.AuthenticatedUserQuery, Types.AuthenticatedUserQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<Types.AuthenticatedUserQuery, Types.AuthenticatedUserQueryVariables>(AuthenticatedUserDocument, options)
}
export function useAuthenticatedUserLazyQuery (baseOptions?: Apollo.LazyQueryHookOptions<Types.AuthenticatedUserQuery, Types.AuthenticatedUserQueryVariables>) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<Types.AuthenticatedUserQuery, Types.AuthenticatedUserQueryVariables>(AuthenticatedUserDocument, options)
}
export function useAuthenticatedUserSuspenseQuery (baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<Types.AuthenticatedUserQuery, Types.AuthenticatedUserQueryVariables>) {
    const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions }
    return Apollo.useSuspenseQuery<Types.AuthenticatedUserQuery, Types.AuthenticatedUserQueryVariables>(AuthenticatedUserDocument, options)
}
export type AuthenticatedUserQueryHookResult = ReturnType<typeof useAuthenticatedUserQuery>
export type AuthenticatedUserLazyQueryHookResult = ReturnType<typeof useAuthenticatedUserLazyQuery>
export type AuthenticatedUserSuspenseQueryHookResult = ReturnType<typeof useAuthenticatedUserSuspenseQuery>
export type AuthenticatedUserQueryResult = Apollo.QueryResult<Types.AuthenticatedUserQuery, Types.AuthenticatedUserQueryVariables>
// import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'

import type { ApolloClient, NormalizedCacheObject } from '@apollo/client'

import { AuthenticatedUserQuery, AuthenticatedUserDocument, useAuthenticatedUserQuery } from '@/gql'


type AuthenticatedUserType = AuthenticatedUserQuery['authenticatedUser']


export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>) {
    const response = await client.query<AuthenticatedUserQuery>({
        query: AuthenticatedUserDocument,
    })

    return response.data.authenticatedUser
}

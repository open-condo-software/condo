import type { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import type { AuthenticatedUserQueryResult, GetActiveOrganizationEmployeeQueryResult } from '@app/condo/gql'
import type { Either } from '@condo/domains/common/types'
import type { NextPageContext } from 'next'


export type PrefetchedDataProps = {
    context: NextPageContext
    user?: AuthenticatedUserQueryResult['data']['authenticatedUser'] | null
    redirectToAuth?: GetPrefetchedDataReturnRedirect
    activeEmployee?: GetActiveOrganizationEmployeeQueryResult['data']['employees'][number] | null
    apolloClient: ApolloClient<NormalizedCacheObject>
}
export type GetPrefetchedDataReturnProps = { props: Record<string, any> }
export type GetPrefetchedDataReturnRedirect = { redirect: { destination: string, permanent?: boolean } }
export type GetPrefetchedDataReturnNotFound = { notFound: true }
export type GetPrefetchedDataReturnType = Either<GetPrefetchedDataReturnProps, Either<GetPrefetchedDataReturnNotFound, GetPrefetchedDataReturnRedirect>>
export type GetPrefetchedData = (props: PrefetchedDataProps) => Promise<GetPrefetchedDataReturnType>

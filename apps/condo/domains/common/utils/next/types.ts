import type { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import type { NextPageContext } from 'next'


export type PrefetchedDataProps<UserType, ActiveEmployeeType> = {
    context: NextPageContext
    user?: UserType
    redirectToAuth?: GetPrefetchedDataReturnRedirect
    activeEmployee?: ActiveEmployeeType
    apolloClient: ApolloClient<NormalizedCacheObject>
}
export type GetPrefetchedDataReturnProps = { props: Record<string, any> }
export type GetPrefetchedDataReturnRedirect = { redirect: { destination: string, permanent?: boolean } }
export type GetPrefetchedDataReturnNotFound = { notFound: true }
export type GetPrefetchedDataReturnType = GetPrefetchedDataReturnProps | GetPrefetchedDataReturnNotFound | GetPrefetchedDataReturnRedirect
export type GetPrefetchedData<UserType, ActiveEmployeeType> = (props: PrefetchedDataProps<UserType, ActiveEmployeeType>) => Promise<GetPrefetchedDataReturnType>

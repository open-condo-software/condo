import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { AuthenticatedUserQuery, AuthenticatedUserDocument, AuthenticatedUserQueryResult } from '@app/condo/gql'
import { NextPageContext } from 'next'

import { GetPrefetchedDataReturnRedirect } from '@condo/domains/common/utils/next/types'


export type PrefetchAuthReturnType = AuthenticatedUserQueryResult['data']['authenticatedUser']
export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>): Promise<PrefetchAuthReturnType> {
    const response = await client.query<AuthenticatedUserQuery>({
        query: AuthenticatedUserDocument,
    })

    return response?.data?.authenticatedUser || null
}


type Redirect = { user: null, redirectToAuth: GetPrefetchedDataReturnRedirect }
type AuthData = { user: PrefetchAuthReturnType | null, redirectToAuth: null }
type RedirectOrAuthDataType = Redirect | AuthData

export async function prefetchAuthOrRedirect (
    client: ApolloClient<NormalizedCacheObject>,
    context: NextPageContext,
): Promise<RedirectOrAuthDataType> {
    const result: RedirectOrAuthDataType = { user: null, redirectToAuth: null }
    const user = await prefetchAuth(client)

    if (user) {
        result.user = user
    } else {
        const { asPath } = context
        const redirectPath = `/auth?next=${encodeURIComponent(asPath)}`
        result.redirectToAuth = {
            redirect: {
                destination: redirectPath,
                permanent: false,
            },
        }
    }

    return result
}

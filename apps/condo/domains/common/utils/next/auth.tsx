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
    redirectPath = '/auth/signin',
): Promise<RedirectOrAuthDataType> {
    const result: RedirectOrAuthDataType = { user: null, redirectToAuth: null }
    const user = await prefetchAuth(client)

    if (user) {
        result.user = user
    } else {
        const { asPath } = context
        const currentPath = asPath.split('?')[0]

        if (currentPath === redirectPath) {
            return result
        }

        const redirectFullPath = `${redirectPath}?next=${encodeURIComponent(asPath)}`
        result.redirectToAuth = {
            redirect: {
                destination: redirectFullPath,
                permanent: false,
            },
        }
    }

    return result
}

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { AuthenticatedUserQuery, AuthenticatedUserDocument, AuthenticatedUserQueryResult } from '@app/condo/gql'
import { GetPrefetchedDataReturnRedirect } from '@app/condo/pages/_app'
import { NextPageContext } from 'next'


type PrefetchAuthReturnType = Promise<AuthenticatedUserQueryResult['data']['authenticatedUser']>
export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>): PrefetchAuthReturnType {
    const response = await client.query<AuthenticatedUserQuery>({
        query: AuthenticatedUserDocument,
    })

    return response?.data?.authenticatedUser || null
}


type Redirect = { user: null, redirectToAuth: GetPrefetchedDataReturnRedirect }
type AuthData = { user: Awaited<ReturnType<typeof prefetchAuth>>, redirectToAuth: null }
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
        const redirectPath = `/auth/signin?next=${encodeURIComponent(asPath)}`
        result.redirectToAuth = {
            redirect: {
                destination: redirectPath,
                permanent: false,
            },
        }
    }

    return result
}

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { AuthenticatedUserQuery, AuthenticatedUserDocument, AuthenticatedUserQueryResult } from '@app/condo/gql'
import { GetServerSideProps, GetServerSidePropsContext } from 'next'

type PrefetchAuthReturnType = Promise<AuthenticatedUserQueryResult['data']['authenticatedUser']>
export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>): PrefetchAuthReturnType {
    const response = await client.query<AuthenticatedUserQuery>({
        query: AuthenticatedUserDocument,
    })

    return response?.data?.authenticatedUser || null
}


type Redirect = { user: null, redirect: Awaited<ReturnType<GetServerSideProps>> }
type AuthData = { user: Awaited<ReturnType<typeof prefetchAuth>>, redirect: null }
type RedirectOrAuthDataType = Redirect | AuthData

export async function prefetchAuthOrRedirect (
    client: ApolloClient<NormalizedCacheObject>,
    context: GetServerSidePropsContext,
): Promise<RedirectOrAuthDataType> {
    const result: RedirectOrAuthDataType = { user: null, redirect: null }
    const user = await prefetchAuth(client)

    if (user) {
        result.user = user
    } else {
        const { resolvedUrl } = context
        result.redirect = {
            unstable_redirect: {
                destination: `/auth/signin?next=${encodeURIComponent(resolvedUrl)}`,
                permanent: false,
            },
        }
    }

    return result
}

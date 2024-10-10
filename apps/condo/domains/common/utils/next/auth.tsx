import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { AuthenticatedUserQuery, AuthenticatedUserDocument } from '@app/condo/gql'
import { GetServerSideProps } from 'next'


export async function prefetchAuth (client: ApolloClient<NormalizedCacheObject>) {
    const response = await client.query<AuthenticatedUserQuery>({
        query: AuthenticatedUserDocument,
    })

    return response.data.authenticatedUser
}

export async function prefetchAuthOrRedirect (client: ApolloClient<NormalizedCacheObject>, context: Parameters<GetServerSideProps>[0]) {
    const result: { user: Awaited<ReturnType<typeof prefetchAuth>> | null, redirect: null | Awaited<ReturnType<GetServerSideProps>> } = { user: null, redirect: null }
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

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import {
    GetContactByIdDocument,
    GetContactByIdQuery, GetContactByIdQueryResult,
    GetContactByIdQueryVariables,
} from '@app/condo/gql'


type PrefetchContactArgs = {
    client: ApolloClient<NormalizedCacheObject>
    contactId: string
}

type PrefetchContactReturnType = {
    contact: GetContactByIdQueryResult['data']['contacts'][number]
}

export async function prefetchContact (args: PrefetchContactArgs): Promise<PrefetchContactReturnType> {
    const { client, contactId } = args

    const response = await client.query<GetContactByIdQuery, GetContactByIdQueryVariables>({
        query: GetContactByIdDocument,
        variables: {
            id: contactId,
        },
    })
    const contacts = response?.data?.contacts || null
    const contact = Array.isArray(contacts) ? contacts[0] : contacts

    return { contact }
}
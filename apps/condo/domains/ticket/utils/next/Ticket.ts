import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import {
    GetTicketByIdDocument,
    GetTicketByIdQuery,
    GetTicketByIdQueryResult,
    GetTicketByIdQueryVariables,
} from '@app/condo/gql'


type PrefetchTicketArgs = {
    client: ApolloClient<NormalizedCacheObject>
    ticketId: string
}

type PrefetchTicketReturnType = {
    ticket: GetTicketByIdQueryResult['data']['tickets'][number]
}

export async function prefetchTicket (args: PrefetchTicketArgs): Promise<PrefetchTicketReturnType> {
    const { client, ticketId } = args

    const response = await client.query<GetTicketByIdQuery, GetTicketByIdQueryVariables>({
        query: GetTicketByIdDocument,
        variables: {
            id: ticketId,
        },
    })
    const tickets = response?.data?.tickets || null
    const ticket = Array.isArray(tickets) ? tickets[0] : tickets

    return { ticket }
}
import { ApolloCache } from '@apollo/client/cache'
import { Ticket } from '@app/condo/schema'

import { generateQueryVariables } from '@condo/domains/common/components/TicketCard/TicketCardList'
import { Ticket as TicketGQL } from '@condo/domains/ticket/gql'

import type { CreateTicketMutation } from '@app/condo/gql'

interface ICachedData {
    objs: Ticket[]
}

type TicketCacheUtilsHook = (cache: ApolloCache<unknown>) => {
    addTicketToQueryCacheForTicketCardList: (ticket: CreateTicketMutation['ticket']) => void
}

export const useCacheUtils: TicketCacheUtilsHook = (cache) => {
    function addTicketToQueryCacheForTicketCardList (ticket) {
        const ticketContactId = ticket?.contact?.id || null
        const queryData = {
            query: TicketGQL.GET_ALL_OBJS_WITH_COUNT_QUERY,
            variables: generateQueryVariables(ticketContactId),
        }

        const cachedData: ICachedData = cache.readQuery(queryData)

        if (cachedData) {
            cache.writeQuery({
                ...queryData,
                data: {
                    ...cachedData,
                    objs: [...cachedData.objs, ticket],
                },
            })
        }
    }

    return { addTicketToQueryCacheForTicketCardList }
}
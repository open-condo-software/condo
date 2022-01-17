import { ApolloCache } from '@apollo/client/cache'
import { generateQueryVariables } from '@condo/domains/common/components/TicketCard/TicketCardList'
import { Ticket as TicketGQL } from '@condo/domains/ticket/gql'
import { ITicketUIState } from '@condo/domains/ticket/utils/clientSchema/Ticket'

interface ICachedData {
    objs: ITicketUIState[],
}

type TicketCacheUtilsHook = (cache: ApolloCache<unknown>) => {
    addTicketToQueryCacheForTicketCardList: (ticket: ITicketUIState) => void
}

export const useCacheUtils: TicketCacheUtilsHook = (cache) => {
    function addTicketToQueryCacheForTicketCardList (ticket) {
        const queryData = {
            query: TicketGQL.GET_ALL_OBJS_WITH_COUNT_QUERY,
            variables: generateQueryVariables(ticket.organization.id, ticket.clientPhone),
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
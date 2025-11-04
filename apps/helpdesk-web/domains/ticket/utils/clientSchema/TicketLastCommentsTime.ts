import {
    Ticket,
    TicketCreateInput,
    TicketUpdateInput,
    QueryAllTicketsArgs,
} from '@app/condo/schema'

import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { TicketLastCommentsTime as TicketLastCommentsTimeGql } from '@condo/domains/ticket/gql'

const {
    useObject,
    useObjects,
    useCount,
} = generateReactHooks<Ticket, TicketCreateInput, TicketUpdateInput, QueryAllTicketsArgs>(TicketLastCommentsTimeGql)

export {
    useObject,
    useObjects,
    useCount,
}
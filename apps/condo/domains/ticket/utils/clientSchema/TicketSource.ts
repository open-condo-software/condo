import {
    TicketSource,
    TicketSourceCreateInput,
    TicketSourceUpdateInput,
    QueryAllTicketSourcesArgs,
} from '@app/condo/schema'

import { generateReactHooks } from '@open-condo/codegen/generate.hooks'

import { TicketSource as TicketSourceGQL } from '@condo/domains/ticket/gql'

const {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useSoftDelete,
} = generateReactHooks<TicketSource, TicketSourceCreateInput, TicketSourceUpdateInput, QueryAllTicketSourcesArgs>(TicketSourceGQL)

export {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useSoftDelete,
}

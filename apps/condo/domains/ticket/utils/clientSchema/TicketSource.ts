import {
    TicketSource,
    TicketSourceCreateInput,
    TicketSourceUpdateInput,
    QueryAllTicketSourcesArgs,
} from '@app/condo/schema'
import { generateNewReactHooks } from '@condo/domains/common/utils/codegeneration/generate.hooks'
import { TicketSource as TicketSourceGQL } from '@condo/domains/ticket/gql'

const {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useSoftDelete,
} = generateNewReactHooks<TicketSource, TicketSourceCreateInput, TicketSourceUpdateInput, QueryAllTicketSourcesArgs>(TicketSourceGQL)

export {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useSoftDelete,
}

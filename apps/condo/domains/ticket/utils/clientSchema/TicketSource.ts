import {
    TicketSource,
    TicketSourceCreateInput,
    TicketSourceUpdateInput,
    QueryAllTicketSourcesArgs,
} from '@app/condo/schema'
import { generateNewReactHooks } from '@condo/domains/common/utils/codegeneration/new.generate.hooks'
import { TicketSource as TicketSourceGQL } from '@condo/domains/ticket/gql'

const {
    useNewObject,
    useNewObjects,
    useNewCreate,
    useNewUpdate,
    useNewSoftDelete,
} = generateNewReactHooks<TicketSource, TicketSourceCreateInput, TicketSourceUpdateInput, QueryAllTicketSourcesArgs>(TicketSourceGQL)

export {
    useNewObject,
    useNewObjects,
    useNewCreate,
    useNewUpdate,
    useNewSoftDelete,
}

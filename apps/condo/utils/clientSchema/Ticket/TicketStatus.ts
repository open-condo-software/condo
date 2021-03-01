import { genReactHooks } from '@core/keystone/gen.gql.react.utils'
import { TicketStatus } from '../../../schema/Ticket/TicketStatus.gql'

function convertGQLItemToUIState (item) {
    if (item.dv !== 1) throw new Error('unsupported item.dv')
    return { ...item, dv: undefined }
}

function convertUIStateToGQLItem (item) {
    return item
}

function convertGQLItemToFormSelectState (item) {
    if (!item) {
        return {}
    }

    const { name, id } = item

    return { value: id, label: name }
}

const {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useDelete,
} = genReactHooks(TicketStatus, { convertGQLItemToUIState, convertUIStateToGQLItem })

export {
    useObject,
    useObjects,
    useCreate,
    useUpdate,
    useDelete,
    convertGQLItemToFormSelectState
}

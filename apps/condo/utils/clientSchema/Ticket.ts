import { genReactHooks } from '@core/keystone/gen.gql.react.utils'

import { Ticket } from '../../schema/Ticket.gql'
import { getClientSideSenderInfo } from '../userid.utils'

function convertGQLItemToUIState (item) {
    if (item.dv !== 1) throw new Error('unsupported item.dv')
    return { ...item, dv: undefined }
}

function convertUIStateToGQLItem (state) {
    const sender = getClientSideSenderInfo()
    const item = { dv: 1, sender, ...state }
    if (item.source) item.source = { connect: { id: item.source } }
    if (item.classifier) item.classifier = { connect: { id: item.classifier } }
    if (item.organization) item.organization = { connect: { id: item.organization } }
    if (item.property) item.property = { connect: { id: item.property } }
    if (item.status) item.status = { connect: { id: item.status } }
    if (item.assignee) item.assignee = { connect: { id: item.assignee } }
    if (item.executor) item.executor = { connect: { id: item.executor } }
    return item
}

function convertGQLItemToFormState (item) {
    if (!item) return {}
    if (item.source) item.source = item.source.id
    if (item.classifier) item.classifier = item.classifier.id
    if (item.organization) item.organization = item.organization.id
    if (item.property) item.property = item.property.id
    if (item.status) item.status = item.status.id
    if (item.assignee) item.assignee = item.assignee.id
    if (item.executor) item.executor = item.executor.id
    return item
}

module.exports = {
    ...genReactHooks(Ticket, { convertGQLItemToUIState, convertUIStateToGQLItem }),
    convertGQLItemToFormState,
}

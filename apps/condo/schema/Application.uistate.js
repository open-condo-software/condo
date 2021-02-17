import { genReactHooks } from '@core/keystone/gen.gql.react.utils'

import { Application } from './Application.gql'
import { getClientSideSenderInfo } from '../utils/userid.utils'

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
    return item
}

module.exports = {
    ...genReactHooks(Application, { convertGQLItemToUIState, convertUIStateToGQLItem }),
}

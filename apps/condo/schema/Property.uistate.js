import { genReactHooks } from '@core/keystone/gen.gql.react.utils'

import { Property } from './Property.gql'
import { getClientSideSenderInfo } from '../utils/userid.utils'

function convertGQLItemToUIState (item) {
    if (item.dv !== 1) throw new Error('unsupported item.dv')
    const href = `/property/${item.id}`
    const avatar = 'https://raschetgkh.ru/images/i/sovet-mkd.jpg'
    return { ...item, avatar, href, dv: undefined }
}

function convertUIStateToGQLItem (state, obj = null) {
    const sender = getClientSideSenderInfo()
    const item = { dv: 1, sender, ...state }
    if (item.organization) item.organization = { connect: { id: item.organization } }
    if (item.addressMeta) item.addressMeta = { ...item.addressMeta, dv: 1 }
    return item
}

module.exports = {
    ...genReactHooks(Property, { convertGQLItemToUIState, convertUIStateToGQLItem }),
}

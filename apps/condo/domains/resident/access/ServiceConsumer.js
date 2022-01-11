
const { throwAuthenticationError } = require('@condo/domains/common/utils/apolloErrorFormatter')
const { USER_SCHEMA_NAME } = require('@condo/domains/common/constants/utils')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { getByCondition } = require('@core/keystone/schema')
const { isSoftDelete } = require('@core/keystone/access')

async function canReadServiceConsumers ({ authentication: { item, listKey } }) {
    if (!listKey || !item) return throwAuthenticationError()
    if (item.deletedAt) return false

    if (listKey === USER_SCHEMA_NAME) {
        if (item.isSupport || item.isAdmin) return {}
        if (item.type === RESIDENT) {
            return { resident: { user: { id: item.id }, deletedAt: null } }
        }

        return false
    }

    return false
}

async function canManageServiceConsumers ({ authentication: { item, listKey }, originalInput, operation, itemId }) {
    if (!listKey || !item) return throwAuthenticationError()
    if (item.deletedAt) return false
    if (listKey === USER_SCHEMA_NAME) {
        if (item.isSupport || item.isAdmin) return true
        if (item.type === RESIDENT) {
            if (operation === 'update' && itemId) {
                const serviceConsumer = await getByCondition('ServiceConsumer', {
                    id: itemId,
                    deletedAt: null,
                })
                if (!serviceConsumer) return false
                const resident = await getByCondition('Resident', {
                    id: serviceConsumer.resident,
                    deletedAt: null,
                })
                if (!resident) return false
                if (resident.user !== item.id) return false
                console.log(originalInput)
                return isSoftDelete(originalInput)
            }
            return false
        }
        return false
    }
    return false
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadServiceConsumers,
    canManageServiceConsumers,
}

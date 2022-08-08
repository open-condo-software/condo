
const { throwAuthenticationError } = require('@condo/keystone/apolloErrorFormatter')
const { RESIDENT } = require('@condo/domains/user/constants/common')
const { getByCondition } = require('@condo/keystone/schema')
const { isSoftDelete } = require('@condo/keystone/access')

async function canReadServiceConsumers ({ authentication: { item: user } }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    
    if (user.isSupport || user.isAdmin) return {}

    if (user.type === RESIDENT) {
        return { resident: { user: { id: user.id }, deletedAt: null } }
    }

    return false
}

async function canManageServiceConsumers ({ authentication: { item: user }, originalInput, operation, itemId }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isSupport || user.isAdmin) return true

    if (user.type === RESIDENT) {
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
            if (resident.user !== user.id) return false

            return isSoftDelete(originalInput)
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

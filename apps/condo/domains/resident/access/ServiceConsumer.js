
const { ServiceConsumer, Resident } = require('@condo/domains/resident/utils/serverSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')

async function canReadServiceConsumers ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin || user.isSupport) return {}
    if (user.type === RESIDENT) {
        return {
            resident: { user: { id: user.id } },
        }
    }
    return false
}

async function canManageServiceConsumers ({ authentication: { item: user }, context, originalInput, operation, itemId }) {
    if (!user) return false
    if (user.isAdmin || user.isSupport) return true
    if (user.type === RESIDENT) {
        if (operation === 'update') {
            const [serviceConsumer] = await ServiceConsumer.getAll(context, { id: itemId })
            if (!serviceConsumer) return false
            const [resident] = await Resident.getAll(context, { id: serviceConsumer.resident.id })
            const isOwnBillingAccount = resident.user.id === user.id

            let isSoftDeleteOperation = true

            const SAFE_FIELDS = ['dv', 'sender', 'deletedAt']
            for (let prop in originalInput) {
                if (!originalInput.hasOwnProperty(prop)) { continue }
                if ( !SAFE_FIELDS.includes(prop) && !prop.startsWith('_') ) {
                    isSoftDeleteOperation = false
                }
            }

            return isOwnBillingAccount && isSoftDeleteOperation
        }
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

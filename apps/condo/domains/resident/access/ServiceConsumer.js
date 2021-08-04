// @ts-nocheck
import { ServiceConsumer, Resident } from '@condo/domains/resident/utils/serverSchema'

const { RESIDENT } = require('@condo/domains/user/constants/common')
async function canReadServiceConsumers ({ authentication: { item: user } }) {
    if (!user) return false
    if (user.isAdmin) return {}
    if (user.type === RESIDENT) {
        return {
            resident: { user: { id: user.id } },
        }
    }
    return false
}

async function canManageServiceConsumers ({ authentication: { item: user }, context, originalInput, operation, itemId }) {
    if (!user) return false
    if (user.isAdmin) return true
    if (user.type === RESIDENT) {
        if (operation === 'update') {
            const [serviceConsumer] = await ServiceConsumer.getAll(context, { id: itemId })
            if (!serviceConsumer) return false
            const [resident] = await Resident.getAll(context, { id: serviceConsumer.resident.id })
            return resident.user.id === user.id
        }
    }
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadServiceConsumers,
    canManageServiceConsumers,
}

// @ts-nocheck
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

async function canManageServiceConsumers ({ authentication: { item: user }, originalInput, operation, itemId }) {
    if (!user) return false
    if (user.isAdmin) return true
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadServiceConsumers,
    canManageServiceConsumers,
}

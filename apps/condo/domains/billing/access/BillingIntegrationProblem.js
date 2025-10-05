const { canReadBillingEntity, canManageBillingEntityWithContext } = require('../utils/accessSchema')

async function canReadBillingIntegrationProblems (args) {
    return await canReadBillingEntity(args)
}

async function canManageBillingIntegrationProblems (args) {
    return await canManageBillingEntityWithContext(args)
}

/*
  Rules are logical functions that used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items.
*/
module.exports = {
    canReadBillingIntegrationProblems,
    canManageBillingIntegrationProblems,
}

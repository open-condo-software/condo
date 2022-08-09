const { getById } = require('@condo/keystone/schema')

// TODO(savelevMatthew): Replace with single request from serverSchema after gql refactoring
/**
 * Combine current state of multiple billing entities into single object
 * to make frozen copy of them if they change later
 * This will allow support to resolve some customers conflicts
 *
 * @param {Object} flatReceipt BillingReceipt received by "find" from "@condo/keystone/schema"
 */

async function freezeBillingReceipt (flatReceipt) {
    const account = await getById('BillingAccount', flatReceipt.account)
    const property = await getById('BillingProperty', flatReceipt.property)
    // NOTE: NOT including context because it's not helpful for support, but contains sensitive data, such as state / settings
    const context = await getById('BillingIntegrationOrganizationContext', flatReceipt.context)
    const billingIntegration = await getById('BillingIntegration', context.integration)
    const organization = await getById('Organization', context.organization)
    const receiver = await getById('BillingRecipient', flatReceipt.receiver)
    return {
        dv: 1,
        data: {
            ...flatReceipt,
            account,
            property,
            billingIntegration,
            organization,
            receiver,
        },
    }
}

module.exports = {
    freezeBillingReceipt,
}
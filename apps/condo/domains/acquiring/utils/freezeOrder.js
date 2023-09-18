const { getById } = require('@open-condo/keystone/schema')

// TODO(savelevMatthew): Replace with single request from serverSchema after gql refactoring
/**
 * Combine current state of multiple billing entities into single object
 * to make frozen copy of them if they change later
 * This will allow support to resolve some customers conflicts
 *
 * @param {Object} flatOrder BillingReceipt received by "find" from "@open-condo/keystone/schema"
 */

async function freezeOrder (flatOrder) {
    const ticket = await getById('Ticket', flatOrder.ticket)
    const organization = await getById('Organization', ticket.organization)
    const property = await getById('Property', ticket.property)
    const receiver = await getById('BillingRecipient', flatOrder.receiver)
    return {
        dv: 1,
        data: {
            ...flatOrder,
            ticket,
            property,
            organization,
            receiver,
        },
    }
}

module.exports = {
    freezeOrder,
}
const get = require('lodash/get')

const { getOrCreateContactByClientData } = require('@condo/domains/ticket/utils/serverSchema/resolveHelpers')

function addClientInfoToResidentMeterReading (context, resolvedData) {
    const user = get(context, ['req', 'user'])

    resolvedData.client = user.id
    resolvedData.clientName = user.name
    resolvedData.clientPhone = user.phone
    resolvedData.clientEmail = user.email
}

async function connectContactToMeterReading (context, resolvedData, existingItem) {
    let contactId = get(resolvedData, 'contact', null)

    if (!contactId) {
        const contact = await getOrCreateContactByClientData(context, resolvedData, existingItem)
        contactId = contact.id
    }

    return contactId
}

module.exports = {
    addClientInfoToResidentMeterReading,
    connectContactToMeterReading,
}
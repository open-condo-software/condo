const get = require('lodash/get')
const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { Meter } = require('@condo/domains/meter/utils/serverSchema')
const { find } = require('@condo/keystone/schema')

async function addClientInfoToResidentMeterReading (context, resolvedData) {
    const user = get(context, ['req', 'user'])
    const meterId = get(resolvedData, 'meter', null)
    const [meter] = await Meter.getAll(context, { id: meterId })
    const organizationId = get(meter, ['organization', 'id'], null)
    const propertyId = get(meter, ['property', 'id'], null)
    const unitName = get(meter, 'unitName', null)

    const residentName = user.name
    const residentPhone = user.phone
    const residentEmail = user.email
    const [contact] = await find('Contact', {
        phone: residentPhone, organization: { id: organizationId }, property: { id: propertyId },
    })

    if (!contact) {
        const dv = get(resolvedData, 'dv')
        const sender = get(resolvedData, 'sender')

        await Contact.create(context, {
            dv,
            sender,
            organization: { connect: { id: organizationId } },
            property: { connect: { id: propertyId } },
            unitName,
            email: residentEmail,
            phone: residentPhone,
            name: residentName,
        })
    }

    resolvedData.client = user.id
    resolvedData.clientName = user.name
    resolvedData.clientPhone = user.phone
    resolvedData.clientEmail = user.email
}

module.exports = {
    addClientInfoToResidentMeterReading,
}
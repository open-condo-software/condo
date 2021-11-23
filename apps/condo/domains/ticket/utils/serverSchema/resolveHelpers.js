const get = require('lodash/get')

const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { TICKET_ORDER_BY_STATUS, STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

export function addOrderToTicket (resolvedData, statusId) {
    if (statusId === STATUS_IDS.OPEN) {
        resolvedData.order = TICKET_ORDER_BY_STATUS[STATUS_IDS.OPEN]
    } else {
        resolvedData.order = null
    }
}

export async function addClientInfoToResidentTicket (context, resolvedData) {
    const user = get(context, ['req', 'user'])
    const organizationId = get(resolvedData, 'organization')
    const propertyId = get(resolvedData, 'property')
    const unitName = get(resolvedData, 'unitName')

    const residentName = user.name
    const residentPhone = user.phone
    const residentEmail = user.email
    const [contact] = await Contact.getAll(context, {
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
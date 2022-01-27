const get = require('lodash/get')
const { getSectionAndFloorByUnitName } = require('@condo/domains/ticket/utils/unit')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { TICKET_ORDER_BY_STATUS, STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const dayjs = require('dayjs')

function addOrderToTicket (resolvedData) {
    const statusId = get(resolvedData, 'status')
    const timeFrame = dayjs(get(resolvedData, 'timeFrame', null))
    let order = 0

    console.log('resolvedData', resolvedData)

    if (statusId) {
        order += TICKET_ORDER_BY_STATUS[STATUS_IDS.OPEN]
    }

    if (timeFrame) {
        const now = dayjs()
        const isLessThanOneDay = timeFrame.isSameOrBefore(now.add(1, 'day'))

        if (isLessThanOneDay) {
            if (timeFrame.startOf('day').isBefore(now)) {
                order += 50
            } else {
                order += 100
            }
        } else {
            order += 200
        }
    }

    resolvedData.order = order
}

async function addClientInfoToResidentTicket (context, resolvedData) {
    const user = get(context, ['req', 'user'])
    const organizationId = get(resolvedData, 'organization', null)
    const propertyId = get(resolvedData, 'property', null)
    const unitName = get(resolvedData, 'unitName', null)

    const [property] = await Property.getAll(context, {
        id: propertyId,
    })

    const { sectionName, floorName } = getSectionAndFloorByUnitName(property, unitName)
    resolvedData.sectionName = sectionName
    resolvedData.floorName = floorName

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

module.exports = {
    addOrderToTicket,
    addClientInfoToResidentTicket,
}
const get = require('lodash/get')
const { getSectionAndFloorByUnitName } = require('@condo/domains/ticket/utils/unit')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { TICKET_ORDER_BY_STATUS, STATUS_IDS, TERMINAL_TICKET_STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { COMPLETED_STATUS_TYPE, NEW_OR_REOPENED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')

async function updateResolvedDataByResolvedStatus (context, existingItem, resolvedData) {
    const existedStatusId = get(existingItem, 'status')
    const resolvedStatusId = get(resolvedData, 'status')

    if (resolvedStatusId) {
        addOrderToTicket(resolvedData, resolvedStatusId)

        if (TERMINAL_TICKET_STATUS_IDS.includes(resolvedStatusId)) {
            resolvedData.deadline = null
        }

        if (existedStatusId) {
            const existedStatus = await TicketStatus.getOne(context, { id: existedStatusId })
            const resolvedStatus = await TicketStatus.getOne(context, { id: resolvedStatusId })

            if (get(existedStatus, 'type') === COMPLETED_STATUS_TYPE && get(resolvedStatus, 'type') === NEW_OR_REOPENED_STATUS_TYPE) {
                const existedStatusReopenedCounter = existingItem['statusReopenedCounter']
                resolvedData['statusReopenedCounter'] = existedStatusReopenedCounter + 1
                resolvedData['executor'] = null
            }
        }
    }
}

function addOrderToTicket (resolvedData, statusId) {
    if (statusId === STATUS_IDS.OPEN) {
        resolvedData.order = TICKET_ORDER_BY_STATUS[STATUS_IDS.OPEN]
    } else {
        resolvedData.order = null
    }
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
    updateResolvedDataByResolvedStatus,
}
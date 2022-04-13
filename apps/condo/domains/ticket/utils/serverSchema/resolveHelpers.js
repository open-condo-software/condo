const get = require('lodash/get')
const { getSectionAndFloorByUnitName } = require('@condo/domains/ticket/utils/unit')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { TICKET_ORDER_BY_STATUS, STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { COMPLETED_STATUS_TYPE, NEW_OR_REOPENED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')

function calculateTicketOrder (resolvedData, statusId) {
    if (statusId === STATUS_IDS.OPEN) {
        resolvedData.order = TICKET_ORDER_BY_STATUS[STATUS_IDS.OPEN]
    } else {
        resolvedData.order = null
    }
}

async function calculateReopenedCounter (context, existingItem, resolvedData) {
    const existedStatusId = get(existingItem, 'status')
    const resolvedStatusId = get(resolvedData, 'status')

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

async function createContactIfNotExists (context, resolvedData) {
    const user = get(context, ['req', 'user'])
    const organizationId = get(resolvedData, 'organization', null)
    const propertyId = get(resolvedData, 'property', null)
    const unitName = get(resolvedData, 'unitName', null)

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
}

async function setSectionAndFloorFieldsByDataFromPropertyMap (context, resolvedData) {
    const unitName = get(resolvedData, 'unitName', null)
    const propertyId = get(resolvedData, 'property', null)

    const [property] = await Property.getAll(context, {
        id: propertyId,
    })

    const { sectionName, floorName } = getSectionAndFloorByUnitName(property, unitName)
    resolvedData.sectionName = sectionName
    resolvedData.floorName = floorName
}

function setClientNamePhoneEmailFieldsByDataFromUser (user, resolvedData) {
    resolvedData.client = user.id
    resolvedData.clientName = user.name
    resolvedData.clientPhone = user.phone
    resolvedData.clientEmail = user.email
}

function overrideTicketFieldsForResidentUserType (context, resolvedData) {
    resolvedData.canReadByResident = true
    // set default unitType value to tickets, created from older versions of the resident's mobile app where no unitType is passed
    resolvedData.unitType = resolvedData.unitType || FLAT_UNIT_TYPE
}

module.exports = {
    calculateReopenedCounter,
    calculateTicketOrder,
    createContactIfNotExists,
    setSectionAndFloorFieldsByDataFromPropertyMap,
    setClientNamePhoneEmailFieldsByDataFromUser,
    overrideTicketFieldsForResidentUserType,
}
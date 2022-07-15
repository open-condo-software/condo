const get = require('lodash/get')
const { find } = require('@core/keystone/schema')
const { getById, getByCondition } = require('@core/keystone/schema')

const { TicketPropertyHintProperty } = require('@condo/domains/ticket/utils/serverSchema')
const { getSectionAndFloorByUnitName } = require('@condo/domains/ticket/utils/unit')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { TICKET_ORDER_BY_STATUS, STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { COMPLETED_STATUS_TYPE, NEW_OR_REOPENED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { TicketStatus } = require('@condo/domains/ticket/utils/serverSchema')
const { FLAT_UNIT_TYPE, SECTION_SECTION_TYPE, PARKING_UNIT_TYPE, PARKING_SECTION_TYPE } = require('@condo/domains/property/constants/common')

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

async function getOrCreateContact (context, resolvedData) {
    const user = get(context, ['req', 'user'])
    const organizationId = get(resolvedData, 'organization', null)
    const propertyId = get(resolvedData, 'property', null)
    const unitName = get(resolvedData, 'unitName', null)
    const unitType = get(resolvedData, 'unitType', null)

    const residentName = user.name
    const residentPhone = user.phone
    const residentEmail = user.email

    const [contact] = await Contact.getAll(context, {
        phone: residentPhone,
        organization: { id: organizationId },
        property: { id: propertyId },
        unitName,
        unitType,
    })

    if (contact) return contact

    const dv = get(resolvedData, 'dv')
    const sender = get(resolvedData, 'sender')

    return await Contact.create(context, {
        dv,
        sender,
        organization: { connect: { id: organizationId } },
        property: { connect: { id: propertyId } },
        unitName,
        unitType,
        email: residentEmail,
        phone: residentPhone,
        name: residentName,
    })
}

async function setSectionAndFloorFieldsByDataFromPropertyMap (context, resolvedData) {
    const unitName = get(resolvedData, 'unitName', null)
    const propertyId = get(resolvedData, 'property', null)

    const property = await Property.getOne(context, {
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
    // set default unitType and sectionType values to tickets, created from older versions of the resident's mobile app where no unitType and sectionType is passed
    resolvedData.unitType = resolvedData.unitType || FLAT_UNIT_TYPE
    const sectionTypeByUnitType = resolvedData.unitType === PARKING_UNIT_TYPE ? PARKING_SECTION_TYPE : SECTION_SECTION_TYPE
    resolvedData.sectionType = resolvedData.sectionType || sectionTypeByUnitType
}

async function setClientIfContactPhoneAndTicketAddressMatchesResidentFields (operation, resolvedData, existingItem) {
    let contactPhone
    let ticketUnitName
    let ticketUnitType
    let ticketPropertyId

    if (operation === 'create') {
        const contactId = get(resolvedData, 'contact')
        if (!contactId) return

        const contact = await getById('Contact', contactId)
        contactPhone = get(contact, 'phone')
        ticketUnitName = get(resolvedData, 'unitName', null)
        ticketUnitType = get(resolvedData, 'unitType', null)
        ticketPropertyId = get(resolvedData, 'property', null)
    } else if (operation === 'update' && existingItem) {
        const contactId = get(resolvedData, 'contact') || existingItem.contact || null
        if (!contactId) return

        const contact = await getById('Contact', contactId)
        contactPhone = get(contact, 'phone')
        ticketUnitName = get(resolvedData, 'unitName') || existingItem.unitName || null
        ticketUnitType = get(resolvedData, 'unitType') || existingItem.unitType || null
        ticketPropertyId = get(resolvedData, 'property') || existingItem.property || null
    }

    const resident = await getByCondition('Resident', {
        user: { phone: contactPhone },
        property: { id: ticketPropertyId },
        unitName: ticketUnitName,
        unitType: ticketUnitType,
        deletedAt: null,
    })

    const residentUserId = get(resident, 'user')

    if (residentUserId) {
        const residentUser = await getById('User', residentUserId)
        resolvedData.client = residentUser.id
    } else
        resolvedData.client = null
}

async function softDeleteTicketHintPropertiesByProperty (context, updatedItem) {
    const now = new Date().toISOString()
    const { dv, sender } = updatedItem
    // soft delete all TicketPropertyHintProperty objects
    const ticketPropertyHintProperties = await find('TicketPropertyHintProperty', {
        property: { id: updatedItem.id },
        deletedAt: null,
    })

    for (const ticketPropertyHintProperty of ticketPropertyHintProperties) {
        await TicketPropertyHintProperty.update(context, ticketPropertyHintProperty.id, {
            deletedAt: now,
            dv, sender,
        })
    }
}

module.exports = {
    calculateReopenedCounter,
    calculateTicketOrder,
    getOrCreateContact,
    setSectionAndFloorFieldsByDataFromPropertyMap,
    setClientNamePhoneEmailFieldsByDataFromUser,
    overrideTicketFieldsForResidentUserType,
    setClientIfContactPhoneAndTicketAddressMatchesResidentFields,
    softDeleteTicketHintPropertiesByProperty,
}

const dayjs = require('dayjs')
const { isUndefined, isEmpty, get } = require('lodash')

const { execGqlWithoutAccess } = require('@open-condo/codegen/generate.server.utils')
const { find } = require('@open-condo/keystone/schema')
const { getById, getByCondition } = require('@open-condo/keystone/schema')

const { Contact } = require('@condo/domains/contact/utils/serverSchema')
const { OrganizationEmployee } = require('@condo/domains/organization/utils/serverSchema')
const { FLAT_UNIT_TYPE, SECTION_SECTION_TYPE, PARKING_UNIT_TYPE, PARKING_SECTION_TYPE } = require('@condo/domains/property/constants/common')
const { Property } = require('@condo/domains/property/utils/serverSchema')
const { COMPLETED_STATUS_TYPE, NEW_OR_REOPENED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { DEFERRED_STATUS_TYPE } = require('@condo/domains/ticket/constants')
const { FEEDBACK_VALUES_BY_KEY } = require('@condo/domains/ticket/constants/feedback')
const { TICKET_ORDER_BY_STATUS, STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const { PREDICT_TICKET_CLASSIFICATION_QUERY } = require('@condo/domains/ticket/gql')
const { TicketPropertyHintProperty } = require('@condo/domains/ticket/utils/serverSchema')
const { getSectionAndFloorByUnitName } = require('@condo/domains/ticket/utils/unit')

const hasEmployee = (id, employees) => id && employees.some(employee => get(employee, ['user', 'id'], null) === id)

function calculateTicketOrder (resolvedData, statusId) {
    if (statusId === STATUS_IDS.OPEN) {
        resolvedData.order = TICKET_ORDER_BY_STATUS[STATUS_IDS.OPEN]
    } else {
        resolvedData.order = null
    }
}

async function resetDismissedEmployees (existingItem, resolvedData, existedStatus, resolvedStatus, context) {
    const newItem = { ...existingItem, ...resolvedData }
    const assigneeId = get(newItem, ['assignee'])
    const executorId = get(newItem, ['executor'])
    const organizationId = get(newItem, ['organization'])

    const employeeIds = []
    if (assigneeId) employeeIds.push(assigneeId)
    if (executorId) employeeIds.push(executorId)

    if (!isEmpty(employeeIds)) {
        const employees = await OrganizationEmployee.getAll(context, {
            user: { id_in: employeeIds },
            organization: { id: organizationId },
            isBlocked: false,
            deletedAt: null,
        }, {})

        if (!hasEmployee(assigneeId, employees)) {
            resolvedData['assignee'] = null
        }
        if (!hasEmployee(executorId, employees)) {
            resolvedData['executor'] = null
        }
    }
}

async function calculateReopenedCounter (context, existingItem, resolvedData, existedStatus, resolvedStatus) {
    const existedStatusType = get(existedStatus, 'type')
    const resolvedStatusType = get(resolvedStatus, 'type')

    if (existedStatusType === COMPLETED_STATUS_TYPE && resolvedStatusType === NEW_OR_REOPENED_STATUS_TYPE) {
        const existedStatusReopenedCounter = existingItem['statusReopenedCounter']
        resolvedData['statusReopenedCounter'] = existedStatusReopenedCounter + 1
        await resetDismissedEmployees(existingItem, resolvedData, existedStatus, resolvedStatus, context)
    }
}

function calculateStatusUpdatedAt (resolvedData, existedStatusId, resolvedStatusId) {
    if (!resolvedData.statusUpdatedAt && resolvedStatusId !== existedStatusId) {
        resolvedData['statusUpdatedAt'] = new Date().toISOString()
    }
}

function calculateCompletedAt (resolvedData, existedStatus, resolvedStatus) {
    const now = new Date().toISOString()
    const resolvedStatusType = get(resolvedStatus, 'type')
    const existedStatusType = get(existedStatus, 'type')

    if (resolvedStatusType === COMPLETED_STATUS_TYPE && existedStatusType !== COMPLETED_STATUS_TYPE) {
        resolvedData['completedAt'] = now
    }
}

function calculateIsCompletedAfterDeadline (resolvedData, existingItem) {
    const newItem = { ...existingItem, ...resolvedData }
    const completedAt = get(newItem, 'completedAt')
    const deadline = get(newItem, 'deadline')
    const statusUpdatedAt = get(newItem, 'statusUpdatedAt')

    const prevStatusId = get(existingItem, 'status')
    const nextStatusId = get(newItem, 'status')

    let stopPoint

    if (nextStatusId === STATUS_IDS.DECLINED) {
        if ((prevStatusId === STATUS_IDS.COMPLETED || prevStatusId === STATUS_IDS.CLOSED || prevStatusId === STATUS_IDS.DECLINED) && completedAt) {
            stopPoint = completedAt
        } else {
            stopPoint = statusUpdatedAt
        }
    } else if (nextStatusId === STATUS_IDS.COMPLETED) {
        stopPoint = completedAt
    } else if (nextStatusId === STATUS_IDS.CLOSED) {
        if ((prevStatusId === STATUS_IDS.COMPLETED || prevStatusId === STATUS_IDS.CLOSED) && completedAt) {
            stopPoint = completedAt
        } else {
            stopPoint = statusUpdatedAt
        }
    }

    if (!deadline || !stopPoint) {
        resolvedData['isCompletedAfterDeadline'] = false
    } else {
        resolvedData['isCompletedAfterDeadline'] = dayjs(stopPoint).diff(deadline) > 0
    }
}

function calculateDeferredUntil (resolvedData, existedStatus, resolvedStatus) {
    if (existedStatus.type === DEFERRED_STATUS_TYPE && resolvedStatus.type !== existedStatus.type) {
        resolvedData.deferredUntil = null
    }
}

async function getOrCreateContactByClientData (context, resolvedData, existingItem) {
    const organizationId = get(resolvedData, 'organization', null) || get(existingItem, 'organization', null)
    const propertyId = get(resolvedData, 'property', null) || get(existingItem, 'property', null)
    const unitName = get(resolvedData, 'unitName', null) || get(existingItem, 'unitName', null)
    const unitType = get(resolvedData, 'unitType', null) || get(existingItem, 'unitType', null)
    const clientPhone = get(resolvedData, 'clientPhone') || get(existingItem, 'clientPhone', null)
    const clientName = get(resolvedData, 'clientName') || get(existingItem, 'clientName', null)
    const clientEmail = get(resolvedData, 'clientEmail') || get(existingItem, 'clientEmail', null)

    const [contact] = await Contact.getAll(context, {
        phone: clientPhone,
        organization: { id: organizationId },
        property: { id: propertyId },
        unitName,
        unitType,
        deletedAt: null,
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
        phone: clientPhone,
        name: clientName,
        email: clientEmail,
    })
}

async function setSectionAndFloorFieldsByDataFromPropertyMap (context, resolvedData) {
    const unitName = get(resolvedData, 'unitName', null)
    const propertyId = get(resolvedData, 'property', null)
    const unitType = get(resolvedData, 'unitType', null)
    const property = await Property.getOne(context, {
        id: propertyId,
    })

    const { sectionName, floorName, sectionType } = getSectionAndFloorByUnitName(property, unitName, unitType)
    resolvedData.sectionName = sectionName
    resolvedData.sectionType = sectionType
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
    resolvedData.isResidentTicket = true
    // set default unitType and sectionType values to tickets, created from older versions of the resident's mobile app where no unitType and sectionType is passed
    if (resolvedData.unitName) {
        resolvedData.unitType = resolvedData.unitType || FLAT_UNIT_TYPE
    }
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

async function connectContactToTicket (context, resolvedData, existingItem) {
    const resolvedContact = get(resolvedData, 'contact', null)

    if (!resolvedContact) {
        const resolvedIsResidentTicket = get(resolvedData, 'isResidentTicket')
        const existedIsResidentTicket = get(existingItem, 'isResidentTicket')
        const isResidentTicket = isUndefined(resolvedIsResidentTicket) ? existedIsResidentTicket : resolvedIsResidentTicket

        if (isResidentTicket) {
            const updatedObj = { ...existingItem, ...resolvedData }

            if (updatedObj.clientName && updatedObj.clientPhone) {
                const contact = await getOrCreateContactByClientData(context, resolvedData, existingItem)
                resolvedData.contact = contact.id
                resolvedData.clientName = contact.name
                resolvedData.clientPhone = contact.phone
            } else {
                resolvedData.isResidentTicket = false
            }
        } else if (existedIsResidentTicket && resolvedIsResidentTicket === false) {
            resolvedData.contact = null
        }
    } else {
        resolvedData.isResidentTicket = true
    }
}

async function setDeadline (resolvedData) {
    const organizationId = get(resolvedData, 'organization')
    const deadline = get(resolvedData, 'deadline')
    if (organizationId && !deadline) {
        const ticketOrganizationSetting = await getByCondition('TicketOrganizationSetting', {
            organization: { id: organizationId },
        })
        if (ticketOrganizationSetting) {
            const defaultDeadlineDuration = get(ticketOrganizationSetting, 'defaultDeadlineDuration', null)
            if (defaultDeadlineDuration) {
                const durationAsMs = dayjs.duration(defaultDeadlineDuration).asMilliseconds()
                resolvedData.deadline = dayjs().add(durationAsMs, 'ms').toISOString()
            } else {
                resolvedData.deadline = null
            }
        }
    }
}

function updateStatusAfterResidentFeedback (resolvedData) {
    if (resolvedData.feedbackValue === FEEDBACK_VALUES_BY_KEY.RETURNED) {
        resolvedData.status = STATUS_IDS.OPEN
    } else {
        resolvedData.status = STATUS_IDS.CLOSED
    }
}

async function classifyTicket (context, details) {
    return await execGqlWithoutAccess(context, {
        query: PREDICT_TICKET_CLASSIFICATION_QUERY,
        variables: { data: { details } },
        dataPath: 'obj',
    })
}


module.exports = {
    calculateReopenedCounter,
    calculateTicketOrder,
    getOrCreateContactByClientData,
    setSectionAndFloorFieldsByDataFromPropertyMap,
    setClientNamePhoneEmailFieldsByDataFromUser,
    overrideTicketFieldsForResidentUserType,
    setClientIfContactPhoneAndTicketAddressMatchesResidentFields,
    calculateCompletedAt,
    calculateStatusUpdatedAt,
    softDeleteTicketHintPropertiesByProperty,
    connectContactToTicket,
    calculateDeferredUntil,
    setDeadline,
    updateStatusAfterResidentFeedback,
    classifyTicket,
    calculateIsCompletedAfterDeadline,
}

const dayjs = require('dayjs')
const get = require('lodash/get')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getByCondition, find, getById } = require('@open-condo/keystone/schema')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { SMS_AFTER_TICKET_CREATION } = require('@condo/domains/common/constants/featureflags')
const { TWO_OR_MORE_SPACES_REGEXP } = require('@condo/domains/common/constants/regexps')
const { md5 } = require('@condo/domains/common/utils/crypto')
const {
    TICKET_ASSIGNEE_CONNECTED_TYPE, TICKET_EXECUTOR_CONNECTED_TYPE, TICKET_STATUS_OPENED_TYPE,
    TICKET_STATUS_IN_PROGRESS_TYPE, TICKET_STATUS_COMPLETED_TYPE, TICKET_STATUS_RETURNED_TYPE,
    TICKET_STATUS_DECLINED_TYPE, TRACK_TICKET_IN_DOMA_APP_TYPE,
} = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ORGANIZATION_NAME_PREFIX_AND_QUOTES_REGEXP, ORGANIZATION_TICKET_VISIBILITY, PROPERTY_TICKET_VISIBILITY, PROPERTY_AND_SPECIALIZATION_VISIBILITY, ASSIGNED_TICKET_VISIBILITY } = require('@condo/domains/organization/constants/common')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')
const {
    sendTicketCommentNotifications: sendTicketCommentNotificationsTask,
} = require('@condo/domains/ticket/tasks/sendTicketCommentNotifications')
const { UserTicketCommentReadTime } = require('@condo/domains/ticket/utils/serverSchema')
const { RESIDENT } = require('@condo/domains/user/constants/common')

const { Ticket, TicketCommentsTime } = require('./serverSchema')
const uniq = require('lodash/uniq')
const compact = require('lodash/compact')
const { TICKET_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')

const ASSIGNEE_CONNECTED_EVENT_TYPE = 'ASSIGNEE_CONNECTED'
const EXECUTOR_CONNECTED_EVENT_TYPE = 'EXECUTOR_CONNECTED'
const STATUS_CHANGED_EVENT_TYPE = 'STATUS_CHANGED'
const TICKET_WITHOUT_RESIDENT_CREATED_EVENT_TYPE = 'TICKET_WITHOUT_RESIDENT_CREATED'
const TICKET_CREATED_EVENT_TYPE = 'TICKET_CREATED'

/**
 * Detects possible events within Ticket schema request
 * @param operation
 * @param existingItem
 * @param updatedItem
 * @returns {{}}
 */
const detectTicketEventTypes = ({ operation, existingItem, updatedItem }) => {
    const isCreateOperation = operation === 'create'
    const isUpdateOperation = operation === 'update'
    const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
    const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
    const prevStatusId = !isCreateOperation && get(existingItem, 'status')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const isAssigneeAdded = isCreateOperation && !!nextAssigneeId
    const isAssigneeUpdated = isUpdateOperation && !!nextAssigneeId && nextAssigneeId !== prevAssigneeId
    const isExecutorAdded = isCreateOperation && !!nextExecutorId
    const isExecutorUpdated = isUpdateOperation && nextExecutorId && nextExecutorId !== prevExecutorId
    const nextStatusId = get(updatedItem, 'status')
    const isStatusAdded = isCreateOperation && !!nextStatusId
    const isStatusUpdated = isUpdateOperation && nextStatusId && nextStatusId !== prevStatusId
    const clientId = get(updatedItem, 'client')
    const isResidentTicket = get(updatedItem, 'isResidentTicket')
    const canReadByResident = get(updatedItem, 'canReadByResident')
    const createdBy = get(updatedItem, 'createdBy')
    const result = {}

    /**
     * assignee connected within create ticket operation or
     * assignee connected/changed within update ticket operation
     * and executor is not the same person with assignee
     */
    /**
     * After product case on push notifications with Alla Gubina and Mikhail Rumanovsky on 2022-04-05
     * we decided to temporarily disable sending notifications on assignee connection to ticket
     * This could change in nearest future, so I've commented code instead of deletion
     */
    result[ASSIGNEE_CONNECTED_EVENT_TYPE] = isAssigneeAdded || isAssigneeUpdated

    /**
     * executor connected within create ticket operation or
     * executor connected/changed within update ticket operation
     */
    result[EXECUTOR_CONNECTED_EVENT_TYPE] = isExecutorAdded || isExecutorUpdated

    /**
     * ticket status gets the status open within create ticket operation or
     * ticket status changed within update ticket operation
     */
    result[STATUS_CHANGED_EVENT_TYPE] = clientId && (isStatusAdded || isStatusUpdated)

    /**
     * ticket created and the resident does not have a mobile app or
     * does not have an address as in ticket
     */
    result[TICKET_WITHOUT_RESIDENT_CREATED_EVENT_TYPE] = isCreateOperation && isResidentTicket && !clientId && canReadByResident

    result[TICKET_CREATED_EVENT_TYPE] = isCreateOperation

    return result
}

/**
 * Basically sends different kinds of notifications when assignee/executable added to Ticket, status changed, etc.
 * @param operation
 * @param existingItem
 * @param updatedItem
 * @param context
 * @returns {Promise<void>}
 */
const sendTicketNotifications = async (requestData) => {
    const eventTypes = detectTicketEventTypes(requestData)
    const { operation, existingItem, updatedItem, context } = requestData
    const isCreateOperation =  operation === 'create'
    const prevAssigneeId = !isCreateOperation && get(existingItem, 'assignee')
    const prevExecutorId = !isCreateOperation && get(existingItem, 'executor')
    const prevStatusId = get(existingItem, 'status')
    const nextAssigneeId = get(updatedItem, 'assignee')
    const nextExecutorId = get(updatedItem, 'executor')
    const nextStatusId = get(updatedItem, 'status')
    const clientId = get(updatedItem, 'client')
    const clientPhone = get(updatedItem, 'clientPhone')
    const statusReopenedCounter = get(updatedItem, 'statusReopenedCounter')
    const createdBy = get(updatedItem, 'createdBy')
    const updatedBy = get(updatedItem, 'updatedBy')
    const canReadByResident = get(updatedItem, 'canReadByResident') || get(existingItem, 'canReadByResident')

    const newItem = { ...existingItem, ...updatedItem }
    const organizationId = get(newItem, 'organization', null)

    // TODO(DOMA-2822): get rid of this extra request by returning country within nested organization data
    const organization = await getByCondition('Organization', {
        id: organizationId,
        deletedAt: null,
    })

    /**
     * Detect message language
     * Use DEFAULT_LOCALE if organization.country is unknown
     * (not defined within @condo/domains/common/constants/countries)
     */
    const organizationCountry = get(organization, 'country', conf.DEFAULT_LOCALE)
    const lang = get(COUNTRIES, [organizationCountry, 'locale'], conf.DEFAULT_LOCALE)

    if (eventTypes[TICKET_CREATED_EVENT_TYPE]) {
        // Send notifications to ticket organization employee users by scopes.
        // Notification about ticket creation sends to resident above in STATUS_CHANGED_EVENT_TYPE block
        const employeeUsersToSendNotification = []

        const baseEmployeesQuery = {
            organization: { id: organizationId, deletedAt: null },
            deletedAt: null,
            isRejected: false,
            isBlocked: false,
        }
        const employeesWithOrganizationTicketVisibility = await find('OrganizationEmployee', {
            ...baseEmployeesQuery,
            role: {
                ticketVisibilityType: ORGANIZATION_TICKET_VISIBILITY,
            },
        })
        const employeesWithPropertyTicketVisibility = await find('OrganizationEmployee', {
            ...baseEmployeesQuery,
            role: {
                ticketVisibilityType: PROPERTY_TICKET_VISIBILITY,
            },
        })
        const employeesWithPropertyAndSpecializationTicketVisibility = await find('OrganizationEmployee', {
            ...baseEmployeesQuery,
            role: {
                ticketVisibilityType: PROPERTY_AND_SPECIALIZATION_VISIBILITY,
            },
        })

        const ticketProperty = get(newItem, 'property')
        const ticketCategory = get(newItem, 'categoryClassifier')

        const organizationPropertyScopes = await find('PropertyScope', {
            organization: { id: organizationId, deletedAt: null },
            deletedAt: null,
        })
        const employeeSpecializations = await find('OrganizationEmployeeSpecialization', {
            employee: { id_in: employeesWithPropertyAndSpecializationTicketVisibility.map(obj => obj.id), deletedAt: null },
            specialization: { id: ticketCategory, deletedAt: null },
            deletedAt: null,
        })
        const employeesWithMatchedCategory = await find('OrganizationEmployee', {
            id_in: compact(employeeSpecializations.map(obj => get(obj, 'employee', null))),
            deletedAt: null,
        })

        // all employees with organization ticket visibility, because they are visible all organization tickets
        employeeUsersToSendNotification.push(...(employeesWithOrganizationTicketVisibility.map(employee => employee.user)))
        // assignee and executor of ticket (ASSIGNED_TICKET_VISIBILITY)
        employeeUsersToSendNotification.push(...[newItem.assignee, newItem.executor])

        const isDefaultScopeExists = organizationPropertyScopes.find(scope => scope.hasAllProperties && scope.hasAllEmployees)

        if (isDefaultScopeExists) {
            employeeUsersToSendNotification.push(...(employeesWithPropertyTicketVisibility.map(employee => employee.user)))
            employeeUsersToSendNotification.push(...(employeesWithMatchedCategory.map(employee => employee.user)))
        } else {
            const propertyScopeProperties = await find('PropertyScopeProperty', {
                propertyScope: { id_in: organizationPropertyScopes.map(scope => scope.id), deletedAt: null },
                property: { id: ticketProperty, deletedAt: null },
                deletedAt: null,
            })
            const scopesWithTicketProperty = organizationPropertyScopes.filter(
                scope => propertyScopeProperties.find(obj => obj.propertyScope === scope.id) || scope.hasAllProperties
            )

            if (scopesWithTicketProperty.find(scope => scope.hasAllEmployees)) {
                employeeUsersToSendNotification.push(...(employeesWithPropertyTicketVisibility.map(employee => employee.user)))
                employeeUsersToSendNotification.push(...(employeesWithMatchedCategory.map(employee => employee.user)))
            } else {
                const propertyScopeOrganizationEmployees = await find('PropertyScopeOrganizationEmployee', {
                    deletedAt: null,
                    propertyScope: { id_in: scopesWithTicketProperty.map(scope => scope.id) },
                })

                const matchedEmployeesWithPropertyVisibility = employeesWithPropertyTicketVisibility
                    .filter(employee => propertyScopeOrganizationEmployees.find(obj => obj.employee === employee.id))
                employeeUsersToSendNotification.push(...(matchedEmployeesWithPropertyVisibility.map(employee => employee.user)))

                const matchedCategoryAndPropertyEmployees = employeesWithMatchedCategory
                    .filter(employee => propertyScopeOrganizationEmployees.find(obj => obj.employee === employee.id))
                employeeUsersToSendNotification.push(...(matchedCategoryAndPropertyEmployees.map(employee => employee.user)))
            }
        }

        const employeeUsers = uniq(compact(
            employeeUsersToSendNotification.filter(userId => userId !== createdBy)
        ))

        for (const userId of employeeUsers) {
            await sendMessage(context, {
                lang,
                to: { user: { id: userId } },
                type: TICKET_CREATED_TYPE,
                meta: {
                    dv: 1,
                    data: {
                        ticketId: updatedItem.id,
                        ticketNumber: updatedItem.number,
                        userId,
                        url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                        organization: organization.name,
                    },
                },
                sender: updatedItem.sender,
                organization: { id: organization.id },
            })
        }
    }

    if (eventTypes[ASSIGNEE_CONNECTED_EVENT_TYPE]) {
        const userId = nextAssigneeId || prevAssigneeId

        await sendMessage(context, {
            lang,
            to: { user: { id: userId } },
            type: TICKET_ASSIGNEE_CONNECTED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId,
                    url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                },
            },
            sender: updatedItem.sender,
            organization: { id: organization.id },
        })
    }

    if (eventTypes[EXECUTOR_CONNECTED_EVENT_TYPE]) {
        const userId = nextExecutorId || prevExecutorId

        await sendMessage(context, {
            lang,
            to: { user: { id: userId } },
            type: TICKET_EXECUTOR_CONNECTED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId: updatedItem.id,
                    ticketNumber: updatedItem.number,
                    userId,
                    url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                },
            },
            sender: updatedItem.sender,
            organization: { id: organization.id },
        })
    }

    if (eventTypes[STATUS_CHANGED_EVENT_TYPE] && canReadByResident) {
        let ticketStatusType

        switch (nextStatusId) {
            case STATUS_IDS.OPEN:
                if (prevStatusId !== STATUS_IDS.COMPLETED && !isCreateOperation)
                    break

                if (statusReopenedCounter > 0)
                    ticketStatusType = updatedBy !== clientId && TICKET_STATUS_RETURNED_TYPE
                else
                    ticketStatusType = createdBy !== clientId && TICKET_STATUS_OPENED_TYPE
                break

            case STATUS_IDS.IN_PROGRESS:
                ticketStatusType = TICKET_STATUS_IN_PROGRESS_TYPE
                break

            case STATUS_IDS.COMPLETED:
                ticketStatusType = TICKET_STATUS_COMPLETED_TYPE
                break

            case STATUS_IDS.DECLINED:
                ticketStatusType = TICKET_STATUS_DECLINED_TYPE
                break
        }

        if (ticketStatusType) {
            const { property: propertyId, organization: organizationId, unitName, unitType } = updatedItem
            const where = {
                user: { id: clientId },
                property: { id: propertyId },
                organization: { id: organizationId },
                unitName,
                unitType,
            }
            const resident = await Resident.getOne(context, where)

            await sendMessage(context, {
                lang,
                to: { user: { id: clientId } },
                type: ticketStatusType,
                meta: {
                    dv: 1,
                    data: {
                        ticketId: updatedItem.id,
                        ticketNumber: updatedItem.number,
                        userId: clientId,
                        url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                        residentId: get(resident, 'id', null),
                    },
                },
                sender: updatedItem.sender,
                organization: { id: organization.id },
            })
        }
    }

    if (eventTypes[TICKET_WITHOUT_RESIDENT_CREATED_EVENT_TYPE] && clientPhone) {
        const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(
            get(requestData, 'context'),
            SMS_AFTER_TICKET_CREATION,
            { organization: organization.id }
        )

        if (isFeatureEnabled) {
            const today = dayjs().format('YYYY-MM-DD')
            const uniqKey = `${today}_${md5(clientPhone)}`
            const ticketOrganizationName = get(organization, 'name', '')
                .replace(ORGANIZATION_NAME_PREFIX_AND_QUOTES_REGEXP, ' ')
                .trim()
                .replace(TWO_OR_MORE_SPACES_REGEXP, ' ')

            await sendMessage(context, {
                lang,
                to: { phone: clientPhone },
                type: TRACK_TICKET_IN_DOMA_APP_TYPE,
                uniqKey,
                meta: {
                    dv: 1,
                    data: {
                        organization: ticketOrganizationName,
                    },
                },
                sender: updatedItem.sender,
                organization: { id: organization.id },
            })
        }
    }
}
const sendTicketCommentNotifications = async (requestData) => {
    const { operation, updatedItem } = requestData

    await sendTicketCommentNotificationsTask.delay({ operation, updatedItem })
}

const createOrUpdateTicketCommentsTime = async (context, updatedItem, userType) => {
    const ticketId = get(updatedItem, 'ticket')
    const dv = get(updatedItem, 'dv')
    const sender = get(updatedItem, 'sender')
    const now = new Date().toISOString()

    const ticketCommentsTime = await getByCondition('TicketCommentsTime', {
        ticket: { id: ticketId },
    })

    if (userType === RESIDENT) {
        if (!ticketCommentsTime) {
            const ticket = await getById('Ticket', ticketId)
            if (!ticket) return false

            await TicketCommentsTime.create(context, {
                dv,
                sender,
                ticket: { connect: { id: ticketId } },
                lastCommentAt: now,
                lastResidentCommentAt: now,
            })
        } else {
            await TicketCommentsTime.update(context, ticketCommentsTime.id, {
                dv,
                sender,
                lastCommentAt: now,
                lastResidentCommentAt: now,
            })
        }
    } else {
        if (!ticketCommentsTime) {
            const ticket = await getById('Ticket', ticketId)
            if (!ticket) return false

            await TicketCommentsTime.create(context, {
                dv,
                sender,
                ticket: { connect: { id: ticketId } },
                lastCommentAt: now,
            })
        } else {
            await TicketCommentsTime.update(context, ticketCommentsTime.id, {
                dv,
                sender,
                lastCommentAt: now,
            })
        }

        const userTicketCommentReadTimeObjects = await find('UserTicketCommentReadTime', {
            ticket: { id: ticketId },
        })

        for (const { id } of userTicketCommentReadTimeObjects) {
            await UserTicketCommentReadTime.update(context, id, {
                dv: 1,
                sender,
                readResidentCommentAt: now,
            })
        }
    }
}

const updateTicketLastCommentTime = async (context, updatedItem, userType) => {
    const ticketId = get(updatedItem, 'ticket')
    const dv = get(updatedItem, 'dv')
    const sender = get(updatedItem, 'sender')
    const lastCommentAt = get(updatedItem, 'createdAt', new Date()).toISOString()
    const lastResidentCommentAt = userType === RESIDENT ? lastCommentAt : undefined

    await Ticket.update(context, ticketId, {
        dv,
        sender,
        lastCommentAt,
        lastResidentCommentAt,
    })
}

module.exports = {
    sendTicketNotifications,
    sendTicketCommentNotifications,
    detectTicketEventTypes,
    createOrUpdateTicketCommentsTime,
    updateTicketLastCommentTime,
    ASSIGNEE_CONNECTED_EVENT_TYPE,
    EXECUTOR_CONNECTED_EVENT_TYPE,
    STATUS_CHANGED_EVENT_TYPE,
}

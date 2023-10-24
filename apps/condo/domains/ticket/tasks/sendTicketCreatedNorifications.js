const { get } = require('lodash')
const compact = require('lodash/compact')
const uniq = require('lodash/uniq')

const conf = require('@open-condo/config')
const { getByCondition, getSchemaCtx, getById, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TICKET_COMMENT_ADDED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { PROPERTY_AND_SPECIALIZATION_VISIBILITY, PROPERTY_TICKET_VISIBILITY, ORGANIZATION_TICKET_VISIBILITY, ASSIGNED_TICKET_VISIBILITY } = require('@condo/domains/organization/constants/common')
const { Resident } = require('@condo/domains/resident/utils/serverSchema')
const { RESIDENT_COMMENT_TYPE } = require('@condo/domains/ticket/constants')
const { Ticket } = require('@condo/domains/ticket/utils/serverSchema')
const { RESIDENT, STAFF } = require('@condo/domains/user/constants/common')

const { TICKET_CREATED_TYPE } = require('../../notification/constants/constants')

const getAvailableToReadTicketUsers = async (employees, roles, ticket) => {
    const availableToReadTicketUsers = [ticket.executor, ticket.assignee]
    const ticketOrganizationId = get(ticket, 'organization', null)
    const employeesWithRoles = employees.map(employee => {
        employee.role = roles.find(role => role.id === employee.role)
        return employee
    })
    const organizationDependsEmployees = employeesWithRoles.filter(
        employee => get(employee, 'role.ticketVisibilityType') === ORGANIZATION_TICKET_VISIBILITY
    )
    const propertyDependsEmployees = employeesWithRoles.filter(
        employee => get(employee, 'role.ticketVisibilityType') === PROPERTY_TICKET_VISIBILITY
    )
    const propertyAndSpecDependsEmployees = employeesWithRoles.filter(
        employee => get(employee, 'role.ticketVisibilityType') === PROPERTY_AND_SPECIALIZATION_VISIBILITY
    )

    const propertyScopes = await getByCondition('PropertyScope', {
        organization: { id: ticketOrganizationId },
        deletedAt: null,
    })
    const hasDefaultScope = propertyScopes.find(propertyScope => propertyScope.hasAllProperties && propertyScope.hasAllEmployees)
    const allEmployeesHasAllSpecs = propertyAndSpecDependsEmployees.every(employee => employee.hasAllSpecializations)

    if (hasDefaultScope) {
        const employeeUsers = [...organizationDependsEmployees, ...propertyDependsEmployees].map(employee => employee.user)

        if (allEmployeesHasAllSpecs) {
            employeeUsers.push(...propertyAndSpecDependsEmployees.map(employee => employee.user))
        }

        availableToReadTicketUsers.push(...employeeUsers)

        return uniq(availableToReadTicketUsers.filter(Boolean))
    }

    return availableToReadTicketUsers
}

/**
 * Sends notifications after ticket created
 */
const sendTicketCreatedNotifications = async (ticketId) => {
    const { keystone: context } = await getSchemaCtx('Ticket')
    const createdTicket = await getById('Ticket', ticketId)
    const ticketOrganizationId = get(createdTicket, 'organization')

    const organization = await getByCondition('Organization', {
        id: ticketOrganizationId,
        deletedAt: null,
    })
    const lang = get(COUNTRIES, [organization.country, 'locale'], conf.DEFAULT_LOCALE)
    const employeeRoles = await find('OrganizationEmployeeRole', {
        canReadTickets: true,
    })
    const organizationEmployees = await find('OrganizationEmployee', {
        deletedAt: null,
        isRejected: false,
        isAccepted: true,
        isBlocked: false,
    })
    const employeesToSendNotifications = organizationEmployees.filter(
        employee => employeeRoles.includes(role => role.id === employee.role)
    )
    const users = await getAvailableToReadTicketUsers(employeesToSendNotifications, employeeRoles, createdTicket)

    for (const employeeUserId of users) {
        await sendMessage(context, {
            lang,
            to: { user: { id: employeeUserId } },
            type: TICKET_CREATED_TYPE,
            meta: {
                dv: 1,
                data: {
                    // ticketId: updatedItem.id,
                    ticketNumber: createdTicket.number,
                    // userId,
                    // url: `${conf.SERVER_URL}/ticket/${updatedItem.id}`,
                    // organizationId: organization.id,
                },
            },
            sender: createdTicket.sender,
            organization: { id: organization.id },
        })
    }
}

module.exports = {
    sendTicketCreatedNotifications: createTask('sendTicketCreatedNotifications', sendTicketCreatedNotifications),
}
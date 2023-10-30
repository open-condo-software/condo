const { get } = require('lodash')
const uniq = require('lodash/uniq')

const conf = require('@open-condo/config')
const { getByCondition, getSchemaCtx, getById, find } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const { COUNTRIES } = require('@condo/domains/common/constants/countries')
const { TICKET_CREATED_TYPE, TICKET_COMMENT_ADDED_TYPE, TICKET_COMMENT_CREATED_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { PROPERTY_AND_SPECIALIZATION_VISIBILITY, PROPERTY_TICKET_VISIBILITY, ORGANIZATION_TICKET_VISIBILITY } = require('@condo/domains/organization/constants/common')


const _getPropertyAndSpecializationsEmployeesAccessedToTicket = async (propertyAndSpecDependsEmployeeInScope, ticketCategoryClassifier) => {
    const availableToReadTicketUsers = []
    const employeesWithAllSpecs = propertyAndSpecDependsEmployeeInScope.filter(employee => employee.hasAllSpecializations)
    const employeeWithoutAllSpecs = propertyAndSpecDependsEmployeeInScope.filter(employee => !employee.hasAllSpecializations)
    const employeeWithMatchedSpecialization = (await find('OrganizationEmployeeSpecialization', {
        deletedAt: null,
        employee: { id_in: employeeWithoutAllSpecs.map(employee => employee.id) },
        specialization: { id: ticketCategoryClassifier },
    })).map(obj => employeeWithoutAllSpecs.find(employee => employee.id === obj.employee))

    availableToReadTicketUsers.push(
        ...employeesWithAllSpecs.map(employee => employee.user),
        ...employeeWithMatchedSpecialization.map(employee => employee.user)
    )

    return availableToReadTicketUsers
}

const getAvailableToReadTicketUsers = async (ticket) => {
    const ticketOrganizationId = get(ticket, 'organization')
    const roles = await find('OrganizationEmployeeRole', {
        organization: { id: ticketOrganizationId },
        canReadTickets: true,
    })
    const organizationEmployees = await find('OrganizationEmployee', {
        organization: { id: ticketOrganizationId },
        deletedAt: null,
        isRejected: false,
        isAccepted: true,
        isBlocked: false,
    })
    const employees = organizationEmployees.filter(
        employee => roles.map(role => role.id).includes(employee.role)
    )
    const availableToReadTicketUsers = [ticket.executor, ticket.assignee]
    const ticketPropertyId = get(ticket, 'property')
    const ticketCategoryClassifier = get(ticket, 'categoryClassifier')

    const employeesWithRoles = employees.map(employee => {
        employee.role = roles.find(role => role.id === employee.role)
        return employee
    })
    const organizationDependsEmployees = employeesWithRoles.filter(
        employee => get(employee, 'role.ticketVisibilityType') === ORGANIZATION_TICKET_VISIBILITY
    )
    availableToReadTicketUsers.push(...organizationDependsEmployees.map(employee => employee.user))

    const propertyDependsEmployees = employeesWithRoles.filter(
        employee => get(employee, 'role.ticketVisibilityType') === PROPERTY_TICKET_VISIBILITY
    )
    const propertyAndSpecDependsEmployees = employeesWithRoles.filter(
        employee => get(employee, 'role.ticketVisibilityType') === PROPERTY_AND_SPECIALIZATION_VISIBILITY
    )

    const propertyScopeProperties = await find('PropertyScopeProperty', {
        deletedAt: null,
        property: { id: ticketPropertyId },
    })
    const propertyScopesWithSameProperty = await find('PropertyScope', {
        deletedAt: null,
        organization: { id: ticketOrganizationId },
        OR: [
            { id_in: propertyScopeProperties.map(propertyScopeProperty => propertyScopeProperty.propertyScope) },
            { hasAllProperties: true },
        ],
    })
    const scopeWithAllEmployees = propertyScopesWithSameProperty.find(scope => scope.hasAllEmployees)

    if (!scopeWithAllEmployees) {
        const employeesInScope = await find('PropertyScopeOrganizationEmployee', {
            deletedAt: null,
            propertyScope: { id_in: propertyScopesWithSameProperty.map(scope => scope.id ) },
            employee: { id_in: [...propertyDependsEmployees, ...propertyAndSpecDependsEmployees].map(employee => employee.id) },
        })

        const propertyAndSpecDependsEmployeeInScope = propertyAndSpecDependsEmployees.filter(employee => employeesInScope.find(scope => scope.employee === employee.id))

        availableToReadTicketUsers.push(
            ...propertyDependsEmployees.filter(employee => employeesInScope.find(scope => scope.employee === employee.id))
                .map(employee => employee.user),
            ...(await _getPropertyAndSpecializationsEmployeesAccessedToTicket(propertyAndSpecDependsEmployeeInScope, ticketCategoryClassifier))
        )
    } else {
        availableToReadTicketUsers.push(
            ...propertyDependsEmployees.map(employee => employee.user),
            ...(await _getPropertyAndSpecializationsEmployeesAccessedToTicket(propertyAndSpecDependsEmployees, ticketCategoryClassifier))
        )
    }

    return uniq(availableToReadTicketUsers.filter(Boolean))
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

    const users = await getAvailableToReadTicketUsers(createdTicket)

    for (const employeeUserId of users) {
        await sendMessage(context, {
            lang,
            to: { user: { id: employeeUserId } },
            type: TICKET_CREATED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId,
                    ticketNumber: createdTicket.number,
                    userId: employeeUserId,
                    url: `${conf.SERVER_URL}/ticket/${ticketId}`,
                    organizationId: organization.id,
                    organizationName: organization.name,
                    details: createdTicket.details,
                },
            },
            sender: createdTicket.sender,
            organization: { id: organization.id },
        })
    }
}

/**
 * Sends notifications after ticket comment created
 */
const sendTicketCommentCreatedNotifications = async (commentId, ticketId) => {
    const { keystone: context } = await getSchemaCtx('Ticket')
    const createdComment = await getById('TicketComment', commentId)
    const user = await getById('User', createdComment.user)
    const userName = user.name
    const ticket = await getById('Ticket', ticketId)
    const ticketOrganizationId = get(ticket, 'organization')

    const organization = await getByCondition('Organization', {
        id: ticketOrganizationId,
        deletedAt: null,
    })
    const lang = get(COUNTRIES, [organization.country, 'locale'], conf.DEFAULT_LOCALE)

    const users = await getAvailableToReadTicketUsers(ticket)
    const usersWithoutSender = users.filter(userId => userId !== createdComment.user)

    for (const employeeUserId of usersWithoutSender) {
        await sendMessage(context, {
            lang,
            to: { user: { id: employeeUserId } },
            type: TICKET_COMMENT_CREATED_TYPE,
            meta: {
                dv: 1,
                data: {
                    ticketId,
                    ticketNumber: ticket.number,
                    userId: employeeUserId,
                    url: `${conf.SERVER_URL}/ticket/${ticketId}`,
                    organizationId: organization.id,
                    organizationName: organization.name,
                    commentId,
                    userName,
                    content: createdComment.content,
                    commentType: createdComment.type,
                },
            },
            sender: createdComment.sender,
            organization: { id: organization.id },
        })
    }
}

module.exports = {
    sendTicketCreatedNotifications: createTask('sendTicketCreatedNotifications', sendTicketCreatedNotifications),
    sendTicketCommentCreatedNotifications: createTask('sendTicketCommentCreatedNotifications', sendTicketCommentCreatedNotifications),
}
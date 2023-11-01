const { get } = require('lodash')
const uniq = require('lodash/uniq')

const { find } = require('@open-condo/keystone/schema')

const { ORGANIZATION_TICKET_VISIBILITY, PROPERTY_TICKET_VISIBILITY, PROPERTY_AND_SPECIALIZATION_VISIBILITY } = require('@condo/domains/organization/constants/common')


const _getPropertyAndSpecializationsEmployeesAccessedToTicket = async (propertyAndSpecDependsEmployeeInScope, ticketCategoryClassifier) => {
    const availableToReadTicketUsers = []
    const employeesWithAllSpecs = propertyAndSpecDependsEmployeeInScope.filter(employee => employee.hasAllSpecializations)

    if (!ticketCategoryClassifier) {
        availableToReadTicketUsers.push(
            ...employeesWithAllSpecs.map(employee => employee.user),
        )

        return availableToReadTicketUsers
    }

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

/**
 * Finds user ids who available to read ticket by role and property scopes logic
 * @param ticketOrganizationId
 * @param ticketPropertyId
 * @param ticketCategoryClassifierId
 * @param ticketExecutorId
 * @param ticketAssigneeId
 * @returns {Promise<String>} User ids
 */
const getUsersAvailableToReadTicketByPropertyScope = async ({
    ticketOrganizationId,
    ticketPropertyId,
    ticketCategoryClassifierId,
    ticketExecutorId,
    ticketAssigneeId,
}) => {
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
    const roleIds = roles.map(role => role.id)
    const employees = organizationEmployees.filter(
        employee => roleIds.includes(employee.role)
    )
    const availableToReadTicketUsers = [ticketExecutorId, ticketAssigneeId]

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
            ...(await _getPropertyAndSpecializationsEmployeesAccessedToTicket(propertyAndSpecDependsEmployeeInScope, ticketCategoryClassifierId))
        )
    } else {
        availableToReadTicketUsers.push(
            ...propertyDependsEmployees.map(employee => employee.user),
            ...(await _getPropertyAndSpecializationsEmployeesAccessedToTicket(propertyAndSpecDependsEmployees, ticketCategoryClassifierId))
        )
    }

    return uniq(availableToReadTicketUsers.filter(Boolean))
}

module.exports = {
    getUsersAvailableToReadTicketByPropertyScope,
}
const { get } = require('lodash')
const uniq = require('lodash/uniq')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { find } = require('@open-condo/keystone/schema')

const { TICKET_NOTIFICATIONS_USER_CACHE, TICKET_NOTIFICATIONS_EXCLUDED_ORGANIZATIONS } = require('@condo/domains/common/constants/featureflags')
const { ORGANIZATION_TICKET_VISIBILITY, PROPERTY_TICKET_VISIBILITY, PROPERTY_AND_SPECIALIZATION_VISIBILITY } = require('@condo/domains/organization/constants/common')


const CACHE_TTL_IN_SECONDS = 30 * 60 // 30 minutes
const _redisClient = getKVClient('default', 'cache')
const _getUsersFromRelatedOrganizationsToSendNotificationCacheKey = (organization) =>
    `cache:ticket:usersToSendNotification:relatedOrganizations:${organization}`
const _getUsersFromOrganizationToSendTicketNotificationCacheKey = (organization, property, categoryClassifier) =>
    `cache:ticket:usersToSendNotification:ticketOrganization:${[organization, property, categoryClassifier].filter(Boolean).join(':')}`
const logger = getLogger('ticket/getUsersToSendTicketRelatedNotifications')

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
const _getUsersFromTicketOrganizationToSendNotification = async ({
    ticketOrganizationId,
    ticketPropertyId,
    ticketCategoryClassifierId,
    isNeedToCacheUsers,
}) => {
    const cacheKey = _getUsersFromOrganizationToSendTicketNotificationCacheKey(ticketOrganizationId, ticketPropertyId, ticketCategoryClassifierId)
    if (isNeedToCacheUsers) {
        const valueFromCache = await _redisClient.get(cacheKey)
        if (valueFromCache) {
            return JSON.parse(valueFromCache)
        }
    }

    const roles = await find('OrganizationEmployeeRole', {
        organization: { id: ticketOrganizationId },
        canReadTickets: true,
        deletedAt: null,
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
    const availableToReadTicketUsers = []

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

    const userIdsToSendNotification = uniq(availableToReadTicketUsers.filter(Boolean))

    if (isNeedToCacheUsers) {
        await _redisClient.set(cacheKey, JSON.stringify(userIdsToSendNotification), 'EX', CACHE_TTL_IN_SECONDS)
    }

    return userIdsToSendNotification
}

const _getUsersFromRelatedOrganizationsToSendNotification = async ({ ticketOrganizationId, isNeedToCacheUsers, excludedOrganizations }) => {
    const cacheKey = _getUsersFromRelatedOrganizationsToSendNotificationCacheKey(ticketOrganizationId)
    if (isNeedToCacheUsers) {
        const valueFromCache = await _redisClient.get(cacheKey)
        if (valueFromCache) {
            return JSON.parse(valueFromCache)
        }
    }

    const organizationLinks = await find('OrganizationLink', {
        from: { deletedAt: null },
        to: { id: ticketOrganizationId, deletedAt: null },
        deletedAt: null,
    })
    let organizationsToSendNotification = organizationLinks.map(link => link?.from)
    if (Array.isArray(excludedOrganizations)) {
        organizationsToSendNotification = organizationsToSendNotification.filter(organizationId => organizationId && !excludedOrganizations.includes(organizationId))
    }
    const employeesFromRelatedOrganizations = await find('OrganizationEmployee', {
        organization: { id_in: organizationsToSendNotification },
        user: { deletedAt: null },
        isRejected: false,
        isAccepted: true,
        isBlocked: false,
        deletedAt: null,
    })
    const userIdsToSendNotification = employeesFromRelatedOrganizations.map(employee => employee.user)

    if (isNeedToCacheUsers) {
        await _redisClient.set(cacheKey, JSON.stringify(userIdsToSendNotification), 'EX', CACHE_TTL_IN_SECONDS)
    }

    return userIdsToSendNotification
}

/*
    Returns id of users who assignee or executor of this ticket
    Or they can read ticket by ticket visibility logic
    Or they are an organization employee from related organization
*/
const getUsersToSendTicketRelatedNotifications = async ({
    ticketOrganizationId,
    ticketPropertyId,
    ticketCategoryClassifierId,
    ticketExecutorId,
    ticketAssigneeId,
}) => {
    try {
        const isNeedToCacheUsers = await featureToggleManager.isFeatureEnabled(null, TICKET_NOTIFICATIONS_USER_CACHE)
        const excludedOrganizations = await featureToggleManager.getFeatureValue(null, TICKET_NOTIFICATIONS_EXCLUDED_ORGANIZATIONS, [])
        if (Array.isArray(excludedOrganizations) && excludedOrganizations.includes(ticketOrganizationId)) {
            return []
        }

        const usersIdFromRelatedOrganizations = await _getUsersFromRelatedOrganizationsToSendNotification({
            ticketOrganizationId,
            isNeedToCacheUsers,
            excludedOrganizations,
        })
        const usersIdFromOrganization = await _getUsersFromTicketOrganizationToSendNotification({
            ticketOrganizationId,
            ticketPropertyId,
            ticketCategoryClassifierId,
            isNeedToCacheUsers,
        })

        return uniq([
            ...[ticketExecutorId, ticketAssigneeId],
            ...usersIdFromOrganization,
            ...usersIdFromRelatedOrganizations,
        ]).filter(Boolean)
    } catch (error) {
        logger.error({ msg: 'getUsersToSendTicketRelatedNotifications error', error, ticketOrganizationId, ticketPropertyId, ticketCategoryClassifierId })

        return []
    }
}

module.exports = {
    getUsersToSendTicketRelatedNotifications,
}
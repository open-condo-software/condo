const { throwAuthenticationError } = require('@open-condo/keystone/apolloErrorFormatter')
const { find } = require('@open-condo/keystone/schema')

const { PROPERTY_TICKET_VISIBILITY, PROPERTY_AND_SPECIALIZATION_VISIBILITY, ORGANIZATION_TICKET_VISIBILITY } = require('@condo/domains/organization/constants/common')
const { queryOrganizationEmployeeFromRelatedOrganizationFor } = require('@condo/domains/organization/utils/accessSchema')
const { mapEmployeeToVisibilityTypeToEmployees, filterEmployeePropertyScopes, filterEmployeeSpecializations } = require('@condo/domains/organization/utils/serverSchema/OrganizationEmployee')
const { FLAT_UNIT_TYPE } = require('@condo/domains/property/constants/common')
const { getPropertyScopes } = require('@condo/domains/scope/utils/serverSchema')

function checkAccessToResidentTicketActions ({ item: user }) {
    if (!user) return throwAuthenticationError()
    if (user.deletedAt) return false
    if (user.isAdmin) return true

    return { user: { id: user.id } }
}

function getTicketFieldsMatchesResidentFieldsQuery (residentUser, residents) {
    return residents.map(resident =>
        ({
            AND: [
                { canReadByResident: true },
                { contact: { phone: residentUser.phone } },
                { property: { id: resident.property } },
                { unitName: resident.unitName },
                { unitType: resident.unitType || FLAT_UNIT_TYPE },
            ],
        })
    )
}

/**
 * Calculate and return access queries depends on user employees visibility types
 */
async function getAccessQueryForUserEmployees (userEmployees) {
    const userEmployeeRoles = await find('OrganizationEmployeeRole', {
        id_in: userEmployees.map(employee => employee.role),
    })
    const employeeToVisibilityType = userEmployees.map(employee => {
        const visibilityType = userEmployeeRoles.find(role => role.id === employee.role).ticketVisibilityType
        return { employee: employee, visibilityType }
    })

    const organizationTicketVisibilityOrganizationIds = []
    const propertiesVisibilityPropertyIds = []
    const propertyAndSpecializationVisibilityAccessQuery = []

    const employeeWithPropertyVisibilityType = mapEmployeeToVisibilityTypeToEmployees(employeeToVisibilityType, PROPERTY_TICKET_VISIBILITY)
    const employeeWithPropertyAndSpecializationVisibilityType = mapEmployeeToVisibilityTypeToEmployees(employeeToVisibilityType, PROPERTY_AND_SPECIALIZATION_VISIBILITY)

    const employeeWithPropertyVisibilityIds = [...employeeWithPropertyVisibilityType, ...employeeWithPropertyAndSpecializationVisibilityType].map(employee => employee.id)
    let propertyScopes = []
    if (employeeWithPropertyVisibilityIds.length > 0) {
        propertyScopes = await getPropertyScopes(employeeWithPropertyVisibilityIds)
    }

    let organizationEmployeeSpecializations = []
    if (employeeWithPropertyAndSpecializationVisibilityType.length > 0) {
        organizationEmployeeSpecializations = await find('OrganizationEmployeeSpecialization', {
            employee: { id_in: employeeWithPropertyAndSpecializationVisibilityType.map(employee => employee.id) },
            deletedAt: null,
        })
    }

    for (const { employee, visibilityType } of employeeToVisibilityType) {
        switch (visibilityType) {
            case ORGANIZATION_TICKET_VISIBILITY: {
                organizationTicketVisibilityOrganizationIds.push(employee.organization)

                break
            }

            case PROPERTY_TICKET_VISIBILITY: {
                const employeePropertyScopes = filterEmployeePropertyScopes(propertyScopes, employee)
                const isEmployeeInDefaultPropertyScope = employeePropertyScopes.find(scope => scope.hasAllProperties)

                // if employee with property visibility added in property scope which includes all properties
                // then he can read all tickets in organization (= all properties in organization)
                if (isEmployeeInDefaultPropertyScope) {
                    organizationTicketVisibilityOrganizationIds.push(employee.organization)

                    break
                }

                const properties = employeePropertyScopes.flatMap(scope => scope.properties)
                propertiesVisibilityPropertyIds.push(...properties)

                break
            }

            case PROPERTY_AND_SPECIALIZATION_VISIBILITY: {
                const isEmployeeHasAllSpecializations = employee.hasAllSpecializations
                const employeePropertyScopes = filterEmployeePropertyScopes(propertyScopes, employee)
                const isEmployeeInDefaultPropertyScope = employeePropertyScopes.find(scope => scope.hasAllProperties)

                if (isEmployeeHasAllSpecializations && isEmployeeInDefaultPropertyScope) {
                    organizationTicketVisibilityOrganizationIds.push(employee.organization)
                } else if (isEmployeeHasAllSpecializations) {
                    const properties = employeePropertyScopes.flatMap(scope => scope.properties)

                    propertiesVisibilityPropertyIds.push(...properties)
                } else {
                    const employeeSpecializations = filterEmployeeSpecializations(organizationEmployeeSpecializations, employee)
                    const properties = employeePropertyScopes.flatMap(scope => scope.properties)

                    propertyAndSpecializationVisibilityAccessQuery.push({
                        AND: [
                            { property: { id_in: properties } },
                            { classifier: { category: { id_in: employeeSpecializations } } },
                        ],
                    })
                }

                break
            }
        }
    }

    return {
        organizationTicketVisibilityAccessQuery: { organization: { id_in: organizationTicketVisibilityOrganizationIds } },
        propertiesTicketVisibilityAccessQuery: { property: { id_in: propertiesVisibilityPropertyIds } },
        propertyAndSpecializationVisibilityAccessQuery: { OR: propertyAndSpecializationVisibilityAccessQuery },
    }
}

async function getTicketAccessForUser (user) {
    const userEmployees = await find('OrganizationEmployee', {
        user: { id: user.id, deletedAt: null },
        deletedAt: null,
    })
    if (!userEmployees || userEmployees.length === 0) return false

    const {
        organizationTicketVisibilityAccessQuery,
        propertiesTicketVisibilityAccessQuery,
        propertyAndSpecializationVisibilityAccessQuery,
    } = await getAccessQueryForUserEmployees(userEmployees)

    return {
        OR: [
            { organization: queryOrganizationEmployeeFromRelatedOrganizationFor(user.id) },
            organizationTicketVisibilityAccessQuery,
            propertiesTicketVisibilityAccessQuery,
            propertyAndSpecializationVisibilityAccessQuery,
            { assignee: { id: user.id } },
            { executor: { id: user.id } },
        ],
    }
}

module.exports = {
    checkAccessToResidentTicketActions,
    getTicketFieldsMatchesResidentFieldsQuery,
    getTicketAccessForUser,
}
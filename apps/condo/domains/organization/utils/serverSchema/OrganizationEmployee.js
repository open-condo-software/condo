const { getItems } = require('@open-keystone/server-side-graphql-client')

/** @deprecated don't use getItems use ServerSide utils */
const getOrganizationEmployee = async ({ context, user, organization }) => {
    const [link] = await getItems({
        ...context,
        listKey: 'OrganizationEmployee',
        where: {
            user: { id: user.id },
            organization: { id: organization.id },
        },
        returnFields: 'id',
    })

    return link
}

function filterEmployeePropertyScopes (propertyScopes, employee) {
    return propertyScopes.filter(scope =>
        scope.hasAllEmployees && scope.organization === employee.organization ||
        scope.employees.find(id => id === employee.id)
    )
}

function filterEmployeeSpecializations (organizationEmployeeSpecializations, employee) {
    return organizationEmployeeSpecializations
        .filter(organizationEmployeeSpecialization => organizationEmployeeSpecialization.employee === employee.id)
        .map(organizationEmployeeSpecialization => organizationEmployeeSpecialization.specialization)
}

function mapEmployeeToVisibilityTypeToEmployees (employeeToVisibilityType, type) {
    return employeeToVisibilityType.filter(({ visibilityType }) => visibilityType === type).map(({ employee }) => employee)
}

module.exports = {
    getOrganizationEmployee,
    filterEmployeePropertyScopes,
    filterEmployeeSpecializations,
    mapEmployeeToVisibilityTypeToEmployees,
}
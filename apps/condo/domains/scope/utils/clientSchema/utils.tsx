import differenceBy from 'lodash/differenceBy'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React from 'react'

import { renderBlockedOption } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    ASSIGNED_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
} from '@condo/domains/organization/constants/common'
import {
    EmployeeNameAndSpecializations,
} from '@condo/domains/organization/utils/clientSchema/Renders'

/**
 * Returns a new array with sorted employees in the following order:
 * 1) employees with specific specializations, starting with fewer specializations
 * 2) employees with hasAllSpecialization flag
 * 3) employees without specializations
 */
export const getEmployeesSortedBySpecializations = (employees, organizationEmployeeSpecializations, categoryClassifier) => {
    const employeesWithAllSpecializations = []
    const employeeWithSpecificSpecializations = []
    const employeesWithNotMatchedSpecializations = []

    employees.forEach(employee => {
        if (employee.hasAllSpecializations) {
            employeesWithAllSpecializations.push(employee)
        } else {
            const employeeSpecializations = organizationEmployeeSpecializations.filter(spec => spec.employee.id === employee.id)
            const isEmployeeHasSelectedSpecialization = !!employeeSpecializations.find(spec => spec.specialization.id === categoryClassifier)
            if (employeeSpecializations && isEmployeeHasSelectedSpecialization) {
                employeeWithSpecificSpecializations.push(employee)
            } else {
                employeesWithNotMatchedSpecializations.push(employee)
            }
        }
    })

    const sortedEmployeeWithSpecificSpecializations = employeeWithSpecificSpecializations.sort((firstEmployee, secondEmployee) => {
        const firstEmployeeSpecializationsCount = organizationEmployeeSpecializations.filter(scope => scope.employee.id === firstEmployee.id).length
        const secondEmployeeSpecializationsCount = organizationEmployeeSpecializations.filter(scope => scope.employee.id === secondEmployee.id).length

        return firstEmployeeSpecializationsCount - secondEmployeeSpecializationsCount
    })

    return [...sortedEmployeeWithSpecificSpecializations, ...employeesWithAllSpecializations, ...employeesWithNotMatchedSpecializations]
}

/**
 * Returns a new array with sorted employees in the following order:
 * 1) employees with PROPERTY_AND_SPECIALIZATION_VISIBILITY ticketVisibilityType, sorted by specializations
 * 2) employees with ASSIGNED_TICKET_VISIBILITY ticketVisibilityType, sorted by specializations
 * 3) employees with other ticketVisibilityType, sorted by specializations
 */
export const getEmployeesSortedByTicketVisibilityType = (employees, organizationEmployeeSpecializations, categoryClassifier) => {
    const employeesWithPropertyAndSpecializationVisibility = employees
        .filter(employee => get(employee, 'role.ticketVisibilityType') === PROPERTY_AND_SPECIALIZATION_VISIBILITY)

    const employeesWithAssigneeVisibility = employees
        .filter(employee => get(employee, 'role.ticketVisibilityType') === ASSIGNED_TICKET_VISIBILITY)

    const employeesWithOtherVisibility = differenceBy(
        employees,
        [...employeesWithPropertyAndSpecializationVisibility, ...employeesWithAssigneeVisibility],
        'id')

    return [
        ...getEmployeesSortedBySpecializations(employeesWithPropertyAndSpecializationVisibility, organizationEmployeeSpecializations, categoryClassifier),
        ...getEmployeesSortedBySpecializations(employeesWithAssigneeVisibility, organizationEmployeeSpecializations, categoryClassifier),
        ...getEmployeesSortedBySpecializations(employeesWithOtherVisibility, organizationEmployeeSpecializations, categoryClassifier),
    ]
}

export const isEmployeeSpecializationAndPropertyMatchesToScope = (
    {
        categoryClassifierId,
        organizationEmployeeSpecializations,
        propertyScopes,
        propertyScopeEmployees,
    }
) =>
    employee => {
        const propertyScopesWithAllPropertiesAndEmployees = propertyScopes.filter(scope => scope.hasAllProperties && scope.hasAllEmployees)

        const isPropertyMatches = propertyScopesWithAllPropertiesAndEmployees.length > 0 ||
            !!propertyScopeEmployees.find(scope => scope.employee.id === employee.id)
        const isSpecializationMatches = employee.hasAllSpecializations ||
            !!organizationEmployeeSpecializations.find(scope => scope.employee.id === employee.id && scope.specialization.id === categoryClassifierId)

        return isPropertyMatches && isSpecializationMatches
    }

export const getPropertyScopeNameByEmployee = (employee, propertyScopes, propertyScopeEmployees) => {
    const propertyScopesWithAllEmployees = propertyScopes.filter(scope => scope.hasAllEmployees)

    if (!isEmpty(propertyScopesWithAllEmployees)) {
        return propertyScopesWithAllEmployees[0].name
    } else {
        const propertyScopeEmployee = propertyScopeEmployees.find(scope => scope.employee.id === employee.id)

        return get(propertyScopeEmployee, ['propertyScope', 'name'])
    }
}

export const convertEmployeesToOptions = (
    intl,
    renderOption,
    employees,
    organizationEmployeeSpecializations = [],
    valuePath = 'user.id',
) => {
    return employees.map(employee => {
        const EmployeeText = employee.isBlocked ? employee.name : (
            <EmployeeNameAndSpecializations
                employee={employee}
                organizationEmployeeSpecializations={organizationEmployeeSpecializations}
            />
        )

        return {
            text: EmployeeText,
            value: get(employee, valuePath),
            title: employee.name,
            data: {
                employee,
            },
        }
    })
        .map(option => get(option, 'data.employee.isBlocked', false) ?
            renderBlockedOption(intl, option) : renderOption(option))
}
import { Typography } from 'antd'
import { differenceBy, isEmpty } from 'lodash'
import React from 'react'

import {
    ASSIGNED_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
} from '@condo/domains/organization/constants/common'
import { getEmployeeSpecializationsMessage } from '@condo/domains/organization/utils/clientSchema/Renders'

/**
 * Returns a new array with sorted employees in the following order:
 * 1) employees with specific specializations, starting with fewer specializations
 * 2) employees with hasAllSpecialization flag
 * 3) employees without specializations
 */
export const getEmployeesSortedBySpecializations = (employees, organizationEmployeeSpecializations) => {
    const employeesWithAllSpecializations = []
    const employeeWithSpecificSpecializations = []
    const employeesWithoutSpecializations = []

    employees.forEach(employee => {
        if (employee.hasAllSpecializations) {
            employeesWithAllSpecializations.push(employee)
        } else {
            const isEmployeeHasSpecialization = organizationEmployeeSpecializations.find(scope => scope.employee.id === employee.id)
            if (isEmployeeHasSpecialization) {
                employeeWithSpecificSpecializations.push(employee)
            } else {
                employeesWithoutSpecializations.push(employee)
            }
        }
    })

    const sortedEmployeeWithSpecificSpecializations = employeeWithSpecificSpecializations.sort((firstEmployee, secondEmployee) => {
        const firstEmployeeSpecializationsCount = organizationEmployeeSpecializations.filter(scope => scope.employee.id === firstEmployee.id).length
        const secondEmployeeSpecializationsCount = organizationEmployeeSpecializations.filter(scope => scope.employee.id === secondEmployee.id).length

        return firstEmployeeSpecializationsCount - secondEmployeeSpecializationsCount
    })

    return [...sortedEmployeeWithSpecificSpecializations, ...employeesWithAllSpecializations, ...employeesWithoutSpecializations]
}

/**
 * Returns a new array with sorted employees in the following order:
 * 1) employees with PROPERTY_AND_SPECIALIZATION_VISIBILITY ticketVisibilityType, sorted by specializations
 * 2) employees with ASSIGNED_TICKET_VISIBILITY ticketVisibilityType, sorted by specializations
 * 3) employees with other ticketVisibilityType, sorted by specializations
 */
export const getEmployeesSortedByTicketVisibilityType = (employees, organizationEmployeeSpecializations) => {
    const employeesWithPropertyAndSpecializationVisibility = employees
        .filter(({ role }) => role.ticketVisibilityType === PROPERTY_AND_SPECIALIZATION_VISIBILITY)

    const employeesWithAssigneeVisibility = employees
        .filter(({ role }) => role.ticketVisibilityType === ASSIGNED_TICKET_VISIBILITY)

    const employeesWithOtherVisibility = differenceBy(
        employees,
        [...employeesWithPropertyAndSpecializationVisibility, ...employeesWithAssigneeVisibility],
        'id')

    return [
        ...getEmployeesSortedBySpecializations(employeesWithPropertyAndSpecializationVisibility, organizationEmployeeSpecializations),
        ...getEmployeesSortedBySpecializations(employeesWithAssigneeVisibility, organizationEmployeeSpecializations),
        ...getEmployeesSortedBySpecializations(employeesWithOtherVisibility, organizationEmployeeSpecializations),
    ]
}

export const isEmployeeSpecializationAndPropertyMatchesToScope = (categoryClassifier, organizationEmployeeSpecializations, propertyScopes, propertyScopeEmployees) =>
    employee => {
        const propertyScopesWithAllPropertiesAndEmployees = propertyScopes.filter(scope => scope.hasAllProperties && scope.hasAllEmployees)

        const isPropertyMatches = propertyScopesWithAllPropertiesAndEmployees.length > 0 ||
            propertyScopeEmployees.find(scope => scope.employee.id === employee.id)
        const isSpecializationMatches = employee.hasAllSpecializations ||
            !!organizationEmployeeSpecializations.find(scope => scope.employee.id === employee.id && scope.specialization.id === categoryClassifier)

        return isPropertyMatches && isSpecializationMatches
    }

export const getPropertyScopeNameByEmployee = (employee, propertyScopes, propertyScopeEmployees) => {
    const propertyScopesWithAllEmployees = propertyScopes.filter(scope => scope.hasAllEmployees)

    if (!isEmpty(propertyScopesWithAllEmployees)) {
        return propertyScopesWithAllEmployees[0].name
    } else {
        const propertyScope = propertyScopeEmployees.find(scope => scope.employee.id === employee.id)

        return propertyScope.name
    }
}

export const convertEmployeesToOptions = (employees, intl, organizationEmployeeSpecializations) => {
    return employees.map(employee => {
        const specializationsMessage = getEmployeeSpecializationsMessage(intl, employee, organizationEmployeeSpecializations)

        const EmployeeText = (
            <Typography.Text>
                {employee.name} {specializationsMessage && (
                    <Typography.Text>
                    ({specializationsMessage})
                    </Typography.Text>
                )}
            </Typography.Text>
        )

        return {
            text: EmployeeText,
            value: employee.user.id,
            title: employee.name,
            data: {
                employee,
            },
        }
    })
}
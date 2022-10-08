import { Typography } from 'antd'
import { differenceBy, isEmpty } from 'lodash'
import React from 'react'
import {
    ASSIGNED_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
} from '@condo/domains/organization/constants/common'
import { getEmployeeSpecializationsMessage } from '@condo/domains/organization/utils/clientSchema/Renders'

export const getEmployeesSortedBySpecializations = (employees, specializationScopes) => {
    const employeesWithAllSpecializations = []
    const employeeWithSpecificSpecializations = []
    const employeesWithoutSpecializations = []

    employees.forEach(employee => {
        if (employee.hasAllSpecializations) {
            employeesWithAllSpecializations.push(employee)
        } else {
            const isEmployeeHasSpecialization = specializationScopes.find(scope => scope.employee.id === employee.id)
            if (isEmployeeHasSpecialization) {
                employeeWithSpecificSpecializations.push(employee)
            } else {
                employeesWithoutSpecializations.push(employee)
            }
        }
    })

    const sortedEmployeeWithSpecificSpecializations = employeeWithSpecificSpecializations.sort((firstEmployee, secondEmployee) => {
        const firstEmployeeSpecializationsCount = specializationScopes.filter(scope => scope.employee.id === firstEmployee.id).length
        const secondEmployeeSpecializationsCount = specializationScopes.filter(scope => scope.employee.id === secondEmployee.id).length

        return firstEmployeeSpecializationsCount - secondEmployeeSpecializationsCount
    })

    return [...sortedEmployeeWithSpecificSpecializations, ...employeesWithAllSpecializations, ...employeesWithoutSpecializations]
}

export const getEmployeesSortedByTicketVisibilityType = (employees, specializationScopes) => {
    const employeesWithPropertyAndSpecializationVisibility = employees
        .filter(({ role }) => role.ticketVisibilityType === PROPERTY_AND_SPECIALIZATION_VISIBILITY)

    const employeesWithAssigneeVisibility = employees
        .filter(({ role }) => role.ticketVisibilityType === ASSIGNED_TICKET_VISIBILITY)

    const employeesWithOtherVisibility = differenceBy(
        employees,
        [...employeesWithPropertyAndSpecializationVisibility, ...employeesWithAssigneeVisibility],
        'id')

    return [
        ...getEmployeesSortedBySpecializations(employeesWithPropertyAndSpecializationVisibility, specializationScopes),
        ...getEmployeesSortedBySpecializations(employeesWithAssigneeVisibility, specializationScopes),
        ...getEmployeesSortedBySpecializations(employeesWithOtherVisibility, specializationScopes),
    ]
}

export const isEmployeeSpecializationAndPropertyMatchesToScope = (categoryClassifier, specializationScopes, propertyScopes, propertyScopeEmployees) =>
    employee => {
        const propertyScopesWithAllPropertiesAndEmployees = propertyScopes.filter(scope => scope.hasAllProperties && scope.hasAllEmployees)

        const isPropertyMatches = propertyScopesWithAllPropertiesAndEmployees.length > 0 ||
            propertyScopeEmployees.find(scope => scope.employee.id === employee.id)
        const isSpecializationMatches = employee.hasAllSpecializations ||
            !!specializationScopes.find(scope => scope.employee.id === employee.id && scope.specialization.id === categoryClassifier)

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

export const convertEmployeesToOptions = (employees, intl, specializationScopes) => {
    return employees.map(employee => {
        const specializationsMessage = getEmployeeSpecializationsMessage(intl, employee, specializationScopes)

        const EmployeeText = (
            <Typography.Text>
                {employee.name} {specializationsMessage && specializationsMessage}
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
import { Alert, Col } from 'antd'
import get from 'lodash/get'
import React, { useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'

import {
    getEmployeesSortedByTicketVisibilityType,
    getPropertyScopeNameByEmployee, isEmployeeSpecializationAndPropertyMatchesToScope,
} from '@condo/domains/scope/utils/clientSchema/utils'

/**
 * Sets the employee user in the assignee and executor fields after selecting ticket category classifier.
 If an employee has a SpecializationScope with a specialization that matches the categoryClassifier
 and the employee is in a PropertyScope that has a ticket property,
 then the employee's user is set to the assignee and executor fields.
 If there was no such employee, then the author of the ticket is set in the assignee field.
 */
export const AutoAssigner = ({
    form,
    categoryClassifierId,
    employees,
    allDataLoaded,
    propertyScopeEmployees,
    propertyScopes,
    organizationEmployeeSpecializations,
}) => {
    const intl = useIntl()
    const AutoAssignAlertTitle = intl.formatMessage({ id: 'ticket.autoAssignAlert.title' })
    const AutoAssignAlertMessage = intl.formatMessage({ id: 'ticket.autoAssignAlert.message' })

    const { user } = useAuth()

    const [autoAssigneePropertyScopeName, setAutoAssigneePropertyScopeName] = useState<string>()

    useDeepCompareEffect(() => {
        if (allDataLoaded) {
            const employeesWithMatchesPropertyAndSpecializationScope = employees.filter(
                isEmployeeSpecializationAndPropertyMatchesToScope(
                    {
                        categoryClassifierId,
                        organizationEmployeeSpecializations,
                        propertyScopes,
                        propertyScopeEmployees,
                    }
                )
            )

            if (employeesWithMatchesPropertyAndSpecializationScope.length > 0) {
                const sortedEmployees = getEmployeesSortedByTicketVisibilityType(
                    employeesWithMatchesPropertyAndSpecializationScope,
                    organizationEmployeeSpecializations,
                    categoryClassifierId,
                )
                const firstEmployee = sortedEmployees.find(employee => !employee.isBlocked)
                const firstEmployeeUserId = get(firstEmployee, 'user.id')

                form.setFieldsValue({
                    assignee: firstEmployeeUserId,
                    executor: firstEmployeeUserId,
                })

                const propertyScopeName = getPropertyScopeNameByEmployee(firstEmployee, propertyScopes, propertyScopeEmployees)
                setAutoAssigneePropertyScopeName(propertyScopeName)
            } else {
                const currentUserId = user.id

                form.setFieldsValue({
                    assignee: currentUserId,
                    executor: null,
                })

                setAutoAssigneePropertyScopeName(null)
            }
        }
    }, [
        allDataLoaded, categoryClassifierId, employees, form, organizationEmployeeSpecializations,
        propertyScopeEmployees, propertyScopes, user.id,
    ])

    return autoAssigneePropertyScopeName ? (
        <Col span={24}>
            <Alert
                showIcon
                type='info'
                message={AutoAssignAlertTitle}
                description={AutoAssignAlertMessage.replace('{name}', autoAssigneePropertyScopeName)}
            />
        </Col>
    ) : null
}
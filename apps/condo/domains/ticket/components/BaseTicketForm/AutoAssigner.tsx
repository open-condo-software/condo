import { Alert, Col } from 'antd'
import { isEmpty } from 'lodash'
import React, { useEffect, useState } from 'react'

import { useAuth } from '@condo/next/auth'
import { useIntl } from '@condo/next/intl'

import {
    getEmployeesSortedByTicketVisibilityType,
    isEmployeeSpecializationAndPropertyMatchesToScope,
    getPropertyScopeNameByEmployee,
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
    propertyId,
    propertyScopeEmployees,
    organizationEmployeeSpecializations,
    propertyScopes,
}) => {
    const intl = useIntl()
    const AutoAssignAlertTitle = intl.formatMessage({ id: 'pages.condo.ticket.autoAssignAlert.title' })
    const AutoAssignAlertMessage = intl.formatMessage({ id: 'pages.condo.ticket.autoAssignAlert.message' })

    const { user } = useAuth()

    const [autoAssigneePropertyScopeName, setAutoAssigneePropertyScopeName] = useState<string>()

    useEffect(() => {
        if (categoryClassifierId && propertyId) {
            const employeesWithMatchesPropertyAndSpecializationScope = propertyScopeEmployees
                .map(scope => scope.employee)
                .filter(
                    isEmployeeSpecializationAndPropertyMatchesToScope(
                        categoryClassifierId, organizationEmployeeSpecializations, propertyScopes, propertyScopeEmployees
                    )
                )

            if (!isEmpty(employeesWithMatchesPropertyAndSpecializationScope)) {
                const sortedEmployees = getEmployeesSortedByTicketVisibilityType(
                    employeesWithMatchesPropertyAndSpecializationScope,
                    organizationEmployeeSpecializations
                )

                const firstEmployee = sortedEmployees[0]
                const firstEmployeeUserId = firstEmployee.user.id

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
                })
            }
        }
    }, [categoryClassifierId, form, propertyId, propertyScopeEmployees, propertyScopes, organizationEmployeeSpecializations, user.id])

    return autoAssigneePropertyScopeName ? (
        <Col span={24}>
            <Alert
                showIcon
                type='info'
                message={AutoAssignAlertTitle}
                description={AutoAssignAlertMessage.replace('{name}', autoAssigneePropertyScopeName)}
            />
        </Col>
    ) : <></>
}
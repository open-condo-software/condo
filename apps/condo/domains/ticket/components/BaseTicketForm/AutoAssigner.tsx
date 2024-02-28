import { Alert, Col } from 'antd'
import get from 'lodash/get'
import React, { useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'

import {
    getEmployeesSortedByTicketVisibilityType,
    getPropertyScopeNameByEmployee, isEmployeeSpecializationAndPropertyMatchesToScope,
} from '@condo/domains/scope/utils/clientSchema/utils'
import { TicketAutoAssignment } from '@condo/domains/ticket/utils/clientSchema'


const selectUserByAutoAssignmentRule = (rule, sortedEmployees, key: 'assignee' | 'executor', defaultUserId?: string) => {
    if (!rule) return defaultUserId

    const desiredEmployee = get(rule, key)
    if (desiredEmployee === null) return null

    const desiredEmployeeId = get(desiredEmployee, 'id')
    if (!desiredEmployeeId) return defaultUserId

    const employee = sortedEmployees.find(employee => employee.id === desiredEmployeeId && !employee.isBlocked)
    const employeeUserId = get(employee, 'user.id')
    if (!employeeUserId) return defaultUserId

    return employeeUserId
}

// todo(DOMA-8404): update docs
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
    organizationId,
}) => {
    const intl = useIntl()
    const AutoAssignAlertTitle = intl.formatMessage({ id: 'pages.condo.ticket.autoAssignAlert.title' })
    const AutoAssignAlertMessage = intl.formatMessage({ id: 'pages.condo.ticket.autoAssignAlert.message' })

    const { user } = useAuth()
    const currentUserId = user.id
    const currentUserCanBeAssignee = useMemo(() => employees.some(employee => get(employee, 'user.id') === currentUserId), [currentUserId, employees])

    const [autoAssigneePropertyScopeName, setAutoAssigneePropertyScopeName] = useState<string>()

    const classifierId = form.getFieldValue('classifier')

    const { loading, obj: rule } = TicketAutoAssignment.useObject({
        where: {
            organization: { id: organizationId },
            classifier: { id: classifierId },
        },
    }, {
        skip: !organizationId || !classifierId,
        fetchPolicy: 'cache-first',
    })

    const allLoaded = allDataLoaded && !loading

    useDeepCompareEffect(() => {
        if (allLoaded) {
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

                const autoSelectedAssigneeId = selectUserByAutoAssignmentRule(rule, sortedEmployees, 'assignee', firstEmployeeUserId)
                const autoSelectedExecutorId = selectUserByAutoAssignmentRule(rule, sortedEmployees, 'executor', firstEmployeeUserId)

                form.setFieldsValue({
                    assignee: autoSelectedAssigneeId,
                    executor: autoSelectedExecutorId,
                })

                const propertyScopeName = getPropertyScopeNameByEmployee(firstEmployee, propertyScopes, propertyScopeEmployees)
                setAutoAssigneePropertyScopeName(propertyScopeName)
            } else {
                form.setFieldsValue({
                    assignee: currentUserCanBeAssignee ? currentUserId : null,
                    executor: null,
                })

                setAutoAssigneePropertyScopeName(null)
            }
        }
    }, [
        categoryClassifierId, employees, form, organizationEmployeeSpecializations,
        propertyScopeEmployees, propertyScopes, currentUserId, currentUserCanBeAssignee, allLoaded, rule,
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
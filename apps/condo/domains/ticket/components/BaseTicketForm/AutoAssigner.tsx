import { Col } from 'antd'
import get from 'lodash/get'
import { useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Alert } from '@open-condo/ui'

import { FadeCol } from '@condo/domains/common/components/FadeCol/FadeCol'
import {
    getEmployeesSortedByTicketVisibilityType,
    getPropertyScopeNameByEmployee, isEmployeeSpecializationAndPropertyMatchesToScope,
} from '@condo/domains/scope/utils/clientSchema/utils'
import { TicketAutoAssignment } from '@condo/domains/ticket/utils/clientSchema'


const selectUserByAutoAssignmentRule = (rule, employees, key: 'assignee' | 'executor') => {
    if (!rule) return null

    const desiredEmployee = get(rule, key)
    if (desiredEmployee === null) return null

    const desiredEmployeeId = get(desiredEmployee, 'id')
    if (!desiredEmployeeId) return null

    const employee = employees.find(employee => employee.id === desiredEmployeeId && !employee.isBlocked)
    const employeeUserId = get(employee, 'user.id')
    if (!employeeUserId) return null

    return employeeUserId
}

/**
 * Sets the employee user in the assignee and executor fields after selecting ticket category classifier.

 1) If the organization has configured rules for auto-substitution of “assignee” and “executor”
 (the “TicketAutoAssignment” scheme), then we try to find a rule that matches the properties of a ticket
 and set a corresponding employee users in the assignee and executor fields (there may be empty values).
 If we couldn’t find the rules (not configured), then go to step 2.

 2) If an employee has a SpecializationScope with a specialization that matches the categoryClassifier
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
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-and-network',
    })

    const loadedRule = !!rule || !loading
    const allLoaded = allDataLoaded && loadedRule

    useDeepCompareEffect(() => {
        if (allLoaded) {

            // 1 - try set assignee and executor by TicketAutoAssignment
            if (rule) {
                const autoSelectedAssigneeUserId = selectUserByAutoAssignmentRule(rule, employees, 'assignee')
                const autoSelectedExecutorUserId = selectUserByAutoAssignmentRule(rule, employees, 'executor')

                form.setFieldsValue({
                    assignee: autoSelectedAssigneeUserId,
                    executor: autoSelectedExecutorUserId,
                })
                setAutoAssigneePropertyScopeName(null)
                return
            }

            // 2 - try set assignee and executor by specialization and ticket visibility
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
                const propertyScopeName = getPropertyScopeNameByEmployee(firstEmployee, propertyScopes, propertyScopeEmployees)

                form.setFieldsValue({
                    assignee: firstEmployeeUserId,
                    executor: firstEmployeeUserId,
                })
                setAutoAssigneePropertyScopeName(propertyScopeName)
                return
            }

            // 3 - set current user as assignee or null and executor to null
            form.setFieldsValue({
                assignee: currentUserCanBeAssignee ? currentUserId : null,
                executor: null,
            })
            setAutoAssigneePropertyScopeName(null)
        }
    }, [
        categoryClassifierId, employees, form, organizationEmployeeSpecializations,
        propertyScopeEmployees, propertyScopes, currentUserId, currentUserCanBeAssignee, allLoaded, rule,
    ])

    return autoAssigneePropertyScopeName ? (
        <FadeCol span={24}>
            <Alert
                showIcon
                type='info'
                message={AutoAssignAlertTitle}
                description={AutoAssignAlertMessage.replace('{name}', autoAssigneePropertyScopeName)}
            />
        </FadeCol>
    ) : null
}

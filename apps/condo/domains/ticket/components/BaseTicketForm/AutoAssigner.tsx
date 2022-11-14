import { Alert, Col } from 'antd'
import { isEmpty } from 'lodash'
import React, { useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'

import {
    getPropertyScopeNameByEmployee,
} from '@condo/domains/scope/utils/clientSchema/utils'
import { useDeepCompareEffect } from '@condo/domains/common/hooks/useDeepCompareEffect'

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
    matchedEmployees,
    propertyScopeEmployees,
    propertyScopes,
}) => {
    const intl = useIntl()
    const AutoAssignAlertTitle = intl.formatMessage({ id: 'pages.condo.ticket.autoAssignAlert.title' })
    const AutoAssignAlertMessage = intl.formatMessage({ id: 'pages.condo.ticket.autoAssignAlert.message' })

    const { user } = useAuth()

    const [autoAssigneePropertyScopeName, setAutoAssigneePropertyScopeName] = useState<string>()

    useDeepCompareEffect(() => {
        if (categoryClassifierId && propertyId) {
            if (!isEmpty(matchedEmployees)) {
                const firstEmployee = matchedEmployees[0]
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
    }, [
        categoryClassifierId, propertyId, propertyScopes, propertyScopeEmployees, matchedEmployees,
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
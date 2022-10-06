import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import {
    ASSIGNED_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
} from '@condo/domains/organization/constants/common'
import { searchEmployeeUserWithSpecializations } from '@condo/domains/organization/utils/clientSchema/search'
import {
    PropertyScope,
    PropertyScopeOrganizationEmployee,
    PropertyScopeProperty,
} from '@condo/domains/scope/utils/clientSchema'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Col, FormInstance, Row, Select, Typography } from 'antd'
import { differenceBy, get } from 'lodash'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useCallback, useEffect, useState } from 'react'
import { TicketFormItem } from './index'

const getOptionsSortedByTicketVisibilityType = (employeeOptions) => {
    const employeesWithPropertyAndSpecializationVisibility = employeeOptions
        .filter(({ data }) => data.employee.role.ticketVisibilityType === PROPERTY_AND_SPECIALIZATION_VISIBILITY)
    const employeesWithAssigneeVisibility = employeeOptions
        .filter(({ data }) => data.employee.role.ticketVisibilityType === ASSIGNED_TICKET_VISIBILITY)
    const employeesWithOtherVisibility = differenceBy(
        employeeOptions,
        [...employeesWithPropertyAndSpecializationVisibility, ...employeesWithAssigneeVisibility],
        'value')

    return [...employeesWithPropertyAndSpecializationVisibility, ...employeesWithAssigneeVisibility, ...employeesWithOtherVisibility]
}

type TicketAssignmentsProps = {
    validations: { [key: string]: Rule[] },
    organizationId: string,
    propertyId: string,
    disableUserInteraction: boolean,
    autoAssign: boolean,
    categoryClassifier: string,
    form: FormInstance
}

const TicketAssignments = ({
    validations,
    organizationId,
    propertyId,
    disableUserInteraction,
    categoryClassifier,
    form,
}: TicketAssignmentsProps) => {
    const intl = useIntl()
    const TicketAssignmentTitle = intl.formatMessage({ id: 'TicketAssignment' })
    const ExecutorLabel = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleLabel = intl.formatMessage({ id: 'field.Responsible' })
    const ExecutorExtra = intl.formatMessage({ id: 'field.Executor.description' })
    const ResponsibleExtra = intl.formatMessage({ id: 'field.Responsible.description' })
    const EmployeesOnPropertyMessage = intl.formatMessage({ id: 'pages.condo.ticket.select.group.employeesOnProperty' })
    const OtherMessage = intl.formatMessage({ id: 'pages.condo.ticket.select.group.other' })
    const AutoAssignAlertTitle = intl.formatMessage({ id: 'pages.condo.ticket.autoAssignAlert.title' })
    const AutoAssignAlertMessage = intl.formatMessage({ id: 'pages.condo.ticket.autoAssignAlert.message' })

    const { isSmall } = useLayoutContext()
    const { user } = useAuth()

    const { objs: propertyScopeProperties } = PropertyScopeProperty.useObjects({
        where: {
            property: { id: propertyId },
        },
    })
    const { objs: propertyScopes } = PropertyScope.useObjects({
        where: {
            organization: { id: organizationId },
            OR: [
                { id_in: propertyScopeProperties.map(scope => scope.propertyScope.id) },
                { hasAllProperties: true },
            ],
        },
    })
    const propertyScopesWithAllPropertiesAndEmployees = propertyScopes.filter(scope => scope.hasAllProperties && scope.hasAllEmployees)
    const { objs: propertyScopeEmployees } = PropertyScopeOrganizationEmployee.useObjects({
        where: {
            propertyScope: { id_in: propertyScopes.map(scope => scope.id) },
        },
    })

    const [autoAssigneePropertyScopeName, setAutoAssigneePropertyScopeName] = useState<string>()
    const [autoAssignedUserId, setAutoAssignedUserId] = useState<string>()

    useEffect(() => {
        form.setFieldsValue({
            assignee: autoAssignedUserId,
            executor: autoAssignedUserId,
        })
    }, [autoAssignedUserId, form])

    const updateAssigneeAndExecutorFields = useCallback((employeeOpt, isPropertyAndSpecializationMatch) => {
        const userId = employeeOpt.value
        setAutoAssignedUserId(userId)

        if (isPropertyAndSpecializationMatch) {
            const { employee } = employeeOpt.data

            if (propertyScopesWithAllPropertiesAndEmployees.length > 0) {
                setAutoAssigneePropertyScopeName(propertyScopesWithAllPropertiesAndEmployees[0].name)
            } else {
                const propertyScope = propertyScopeEmployees.find(scope => scope.employee.id === employee.id)
                setAutoAssigneePropertyScopeName(propertyScope.propertyScope.name)
            }
        } else {
            setAutoAssigneePropertyScopeName(null)
        }
    }, [propertyScopeEmployees, propertyScopesWithAllPropertiesAndEmployees])

    const renderOptionGroups = useCallback((employeeOptions, renderOption) => {
        const result = []

        const employeesWithMatchesPropertyAndSpecializationScope = employeeOptions.filter(({ data }) => {
            const { specializations, employee } = data

            const isPropertyMatches = propertyScopesWithAllPropertiesAndEmployees.length > 0 ||
                propertyScopeEmployees.find(scope => scope.employee.id === employee.id)
            const isSpecializationMatches = employee.hasAllSpecializations ||
                !!specializations.find(({ id }) => id === categoryClassifier)

            return isPropertyMatches && isSpecializationMatches
        })

        const otherEmployees = differenceBy(employeeOptions, employeesWithMatchesPropertyAndSpecializationScope, 'value')

        if (employeesWithMatchesPropertyAndSpecializationScope.length > 0) {
            const sortedEmployeeOpts = getOptionsSortedByTicketVisibilityType(employeesWithMatchesPropertyAndSpecializationScope)
            updateAssigneeAndExecutorFields(sortedEmployeeOpts[0], true)

            result.push(
                <Select.OptGroup label={EmployeesOnPropertyMessage}>
                    {sortedEmployeeOpts.map(renderOption)}
                </Select.OptGroup>
            )
        }

        if (otherEmployees.length > 0) {
            const sortedEmployeeOpts = getOptionsSortedByTicketVisibilityType(otherEmployees)

            if (employeesWithMatchesPropertyAndSpecializationScope.length === 0) {
                const ticketAuthor = sortedEmployeeOpts.find(({ value }) => value === user.id)
                updateAssigneeAndExecutorFields(ticketAuthor, false)

                result.push(
                    sortedEmployeeOpts.map(renderOption)
                )
            } else {
                result.push(
                    <Select.OptGroup label={OtherMessage}>
                        {sortedEmployeeOpts.map(renderOption)}
                    </Select.OptGroup>
                )
            }
        }

        return result
    }, [EmployeesOnPropertyMessage, OtherMessage, categoryClassifier, propertyScopeEmployees,
        propertyScopesWithAllPropertiesAndEmployees.length, updateAssigneeAndExecutorFields, user.id])

    return (
        <Col span={24}>
            <Row gutter={[0, 8]}>
                <Col span={24}>
                    <Typography.Title level={3}>{TicketAssignmentTitle}</Typography.Title>
                </Col>
                <Col span={isSmall ? 24 : 18}>
                    <Row justify='space-between'>
                        {
                            autoAssigneePropertyScopeName && (
                                <Col span={24}>
                                    <Alert
                                        showIcon
                                        type='info'
                                        message={AutoAssignAlertTitle}
                                        description={AutoAssignAlertMessage.replace('name', autoAssigneePropertyScopeName)}
                                    />
                                </Col>
                            )
                        }
                        <Col span={11}>
                            <TicketFormItem
                                name='executor'
                                rules={validations.executor}
                                label={<LabelWithInfo title={ExecutorExtra} message={ExecutorLabel}/>}
                            >
                                <GraphQlSearchInput
                                    showArrow={false}
                                    disabled={disableUserInteraction}
                                    renderOptions={renderOptionGroups}
                                    search={searchEmployeeUserWithSpecializations(
                                        intl,
                                        organizationId,
                                        propertyId,
                                        ({ role }) => (
                                            get(role, 'canBeAssignedAsExecutor', false)
                                        ))}
                                />
                            </TicketFormItem>
                        </Col>
                        <Col span={11}>
                            <TicketFormItem
                                data-cy='ticket__assignee-item'
                                name='assignee'
                                rules={validations.assignee}
                                label={<LabelWithInfo title={ResponsibleExtra} message={ResponsibleLabel}/>}
                            >
                                <GraphQlSearchInput
                                    showArrow={false}
                                    disabled={disableUserInteraction}
                                    renderOptions={renderOptionGroups}
                                    search={searchEmployeeUserWithSpecializations(intl, organizationId, propertyId, ({ role }) => (
                                        get(role, 'canBeAssignedAsResponsible', false)
                                    ))}
                                />
                            </TicketFormItem>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Col>
    )
}

export {
    TicketAssignments,
}

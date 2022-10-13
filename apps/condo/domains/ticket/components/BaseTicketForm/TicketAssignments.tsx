import { Col, FormInstance, Row, Select, Typography } from 'antd'
import { differenceBy } from 'lodash'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { searchEmployeeUserWithSpecializations } from '@condo/domains/organization/utils/clientSchema/search'
import {
    PropertyScope,
    PropertyScopeOrganizationEmployee,
    PropertyScopeProperty,
} from '@condo/domains/scope/utils/clientSchema'
import {
    convertEmployeesToOptions,
    getEmployeesSortedByTicketVisibilityType,
    isEmployeeSpecializationAndPropertyMatchesToScope,
} from '@condo/domains/scope/utils/clientSchema/utils'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'

import { AutoAssigner } from './AutoAssigner'
import { TicketFormItem } from './index'

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

    const { isSmall } = useLayoutContext()

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
    const { objs: propertyScopeEmployees } = PropertyScopeOrganizationEmployee.useObjects({
        where: {
            propertyScope: { id_in: propertyScopes.map(scope => scope.id) },
        },
    })
    const employeeIds = propertyScopeEmployees.map(scope => scope.employee.id)
    const { objs: organizationEmployeeSpecializations, loading } = OrganizationEmployeeSpecialization.useObjects({
        where: {
            employee: { id_in: employeeIds },
        },
    })

    const renderOptionGroups = useCallback((employeeOptions, renderOption) => {
        const result = []

        const employeesWithMatchesPropertyAndSpecializationScope = employeeOptions.filter(
            isEmployeeSpecializationAndPropertyMatchesToScope(
                categoryClassifier, organizationEmployeeSpecializations, propertyScopes, propertyScopeEmployees
            )
        )

        const otherEmployees = differenceBy(employeeOptions, employeesWithMatchesPropertyAndSpecializationScope, 'id')

        if (employeesWithMatchesPropertyAndSpecializationScope.length > 0) {
            const sortedEmployees = getEmployeesSortedByTicketVisibilityType(employeesWithMatchesPropertyAndSpecializationScope, organizationEmployeeSpecializations)

            result.push(
                <Select.OptGroup label={EmployeesOnPropertyMessage} key={EmployeesOnPropertyMessage}>
                    {convertEmployeesToOptions(sortedEmployees, intl, organizationEmployeeSpecializations).map(renderOption)}
                </Select.OptGroup>
            )
        }

        if (otherEmployees.length > 0) {
            const sortedEmployees = getEmployeesSortedByTicketVisibilityType(otherEmployees, organizationEmployeeSpecializations)
            const sortedEmployeeOptions = convertEmployeesToOptions(sortedEmployees, intl, organizationEmployeeSpecializations).map(renderOption)

            if (employeesWithMatchesPropertyAndSpecializationScope.length === 0) {
                result.push(sortedEmployeeOptions)
            } else {
                result.push(
                    <Select.OptGroup label={OtherMessage} key={OtherMessage}>
                        {sortedEmployeeOptions}
                    </Select.OptGroup>
                )
            }
        }

        return result
    }, [EmployeesOnPropertyMessage, OtherMessage, categoryClassifier, intl, propertyScopeEmployees,
        propertyScopes, organizationEmployeeSpecializations])

    const search = useMemo(() => searchEmployeeUserWithSpecializations(intl, organizationId, null),
        [intl, organizationId])

    return (
        <Col span={24}>
            <Row gutter={[0, 8]}>
                <Col span={24}>
                    <Typography.Title level={3}>{TicketAssignmentTitle}</Typography.Title>
                </Col>
                <Col span={isSmall ? 24 : 18}>
                    <Row justify='space-between'>
                        {
                            !loading && propertyId && categoryClassifier && (
                                <AutoAssigner
                                    form={form}
                                    categoryClassifierId={categoryClassifier}
                                    propertyId={propertyId}
                                    propertyScopeEmployees={propertyScopeEmployees}
                                    organizationEmployeeSpecializations={organizationEmployeeSpecializations}
                                    propertyScopes={propertyScopes}
                                />
                            )
                        }
                        <Col span={11}>
                            <TicketFormItem
                                name='executor'
                                rules={validations.executor}
                                label={<LabelWithInfo title={ExecutorExtra} message={ExecutorLabel}/>}
                            >
                                {
                                    !loading && (
                                        <GraphQlSearchInput
                                            showArrow={false}
                                            disabled={disableUserInteraction}
                                            renderOptions={renderOptionGroups}
                                            search={search}
                                        />
                                    )
                                }
                            </TicketFormItem>
                        </Col>
                        <Col span={11}>
                            <TicketFormItem
                                data-cy='ticket__assignee-item'
                                name='assignee'
                                rules={validations.assignee}
                                label={<LabelWithInfo title={ResponsibleExtra} message={ResponsibleLabel}/>}
                            >
                                {
                                    !loading && (
                                        <GraphQlSearchInput
                                            showArrow={false}
                                            disabled={disableUserInteraction}
                                            renderOptions={renderOptionGroups}
                                            search={search}
                                        />
                                    )
                                }
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

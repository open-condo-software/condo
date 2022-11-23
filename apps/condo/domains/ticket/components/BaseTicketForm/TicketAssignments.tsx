import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { GraphQlSearchInput, renderBlockedOption } from '@condo/domains/common/components/GraphQlSearchInput'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { OrganizationEmployeeSpecialization } from '@condo/domains/organization/utils/clientSchema'
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

import { useIntl } from '@open-condo/next/intl'
import { Col, FormInstance, Row, Select, Typography } from 'antd'
import { every } from 'lodash'
import { differenceBy } from 'lodash'
import get from 'lodash/get'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useCallback, useMemo, useState } from 'react'

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
    autoAssign,
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

    const { objs: propertyScopeProperties, loading: propertiesLoading } = PropertyScopeProperty.useAllObjects({
        where: {
            property: { id: propertyId },
        },
    })
    const filteredPropertyScopeProperties = useMemo(() =>
        propertyScopeProperties.filter(scope => scope.property && scope.propertyScope),
    [propertyScopeProperties])
    const { objs: propertyScopes, loading: scopesLoading } = PropertyScope.useAllObjects({
        where: {
            organization: { id: organizationId },
            OR: [
                { id_in: filteredPropertyScopeProperties.map(scope => scope.propertyScope.id) },
                { hasAllProperties: true },
            ],
        },
    })
    const { objs: propertyScopeEmployees, loading: employeesLoading } = PropertyScopeOrganizationEmployee.useAllObjects({
        where: {
            propertyScope: { id_in: propertyScopes.map(scope => scope.id) },
        },
    })
    const filteredPropertyScopeEmployees = useMemo(() =>
        propertyScopeEmployees.filter(scope => scope.employee && scope.propertyScope),
    [propertyScopeEmployees])
    const { objs: organizationEmployeeSpecializations, loading: specializationsLoading } = OrganizationEmployeeSpecialization.useAllObjects({
        where: {
            employee: { organization: { id: organizationId } },
        },
    })
    const filteredEmployeeSpecializations = useMemo(() =>
        organizationEmployeeSpecializations.filter(scope => scope.employee && scope.specialization),
    [organizationEmployeeSpecializations])

    const [matchedEmployees, setMatchedEmployees] = useState([])

    const renderOptionGroups = useCallback((employeeOptions, renderOption) => {
        const result = []
        const employees = employeeOptions
            .map(option => option.employee)
            .filter(employee => employee)
        const employeesWithMatchesPropertyAndSpecializationScope = employees.filter(
            isEmployeeSpecializationAndPropertyMatchesToScope(
                {
                    categoryClassifierId: categoryClassifier,
                    organizationEmployeeSpecializations: filteredEmployeeSpecializations,
                    propertyScopes,
                    propertyScopeEmployees: filteredPropertyScopeEmployees,
                }
            )
        )
        const isAllMatchesEmployeesIsBlocked = every(employeesWithMatchesPropertyAndSpecializationScope, employee => employee.isBlocked)
        const otherEmployees = differenceBy(employees, employeesWithMatchesPropertyAndSpecializationScope, 'id')
        const isAllOtherEmployeesIsBlocked = every(otherEmployees, employee => get(employee, 'isBlocked'))

        if (employeesWithMatchesPropertyAndSpecializationScope.length > 0) {
            const sortedEmployees = getEmployeesSortedByTicketVisibilityType(
                employeesWithMatchesPropertyAndSpecializationScope,
                filteredEmployeeSpecializations,
                categoryClassifier,
            )
            const renderedOptions = convertEmployeesToOptions(intl, renderOption, sortedEmployees, filteredEmployeeSpecializations)
            setMatchedEmployees(sortedEmployees)

            if (!isAllMatchesEmployeesIsBlocked) {
                result.push(
                    <Select.OptGroup label={EmployeesOnPropertyMessage} key={EmployeesOnPropertyMessage}>
                        {renderedOptions}
                    </Select.OptGroup>
                )
            } else {
                result.push(
                    <>
                        {renderedOptions}
                    </>
                )
            }
        } else {
            setMatchedEmployees([])
        }

        if (otherEmployees.length > 0) {
            const sortedEmployees = getEmployeesSortedByTicketVisibilityType(
                otherEmployees,
                filteredEmployeeSpecializations,
                categoryClassifier,
            )
            const sortedEmployeeOptions = convertEmployeesToOptions(intl, renderOption, sortedEmployees, filteredEmployeeSpecializations)

            if (employeesWithMatchesPropertyAndSpecializationScope.length === 0 || isAllMatchesEmployeesIsBlocked) {
                result.push(sortedEmployeeOptions)
            } else {
                if (!isAllOtherEmployeesIsBlocked) {
                    result.push(
                        <Select.OptGroup label={OtherMessage} key={OtherMessage}>
                            {sortedEmployeeOptions}
                        </Select.OptGroup>
                    )
                } else (
                    result.push(
                        <>
                            {sortedEmployeeOptions}
                        </>
                    )
                )
            }
        }

        return result
    }, [
        categoryClassifier, filteredEmployeeSpecializations, propertyScopes, filteredPropertyScopeEmployees,
        EmployeesOnPropertyMessage, intl, OtherMessage,
    ])

    const search = useMemo(() => searchEmployeeUserWithSpecializations(intl, organizationId, null),
        [intl, organizationId])

    const loading = propertiesLoading || scopesLoading || employeesLoading || specializationsLoading

    return (
        <Col span={24}>
            <Row gutter={[0, 8]}>
                <Col span={24}>
                    <Typography.Title level={3}>{TicketAssignmentTitle}</Typography.Title>
                </Col>
                <Col span={isSmall ? 24 : 18}>
                    <Row justify='space-between'>
                        {
                            autoAssign && !loading && propertyId && categoryClassifier && (
                                <AutoAssigner
                                    form={form}
                                    categoryClassifierId={categoryClassifier}
                                    propertyId={propertyId}
                                    matchedEmployees={matchedEmployees}
                                    propertyScopeEmployees={filteredPropertyScopeEmployees}
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
                                            searchMoreFirst={300}
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
                                            searchMoreFirst={300}
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

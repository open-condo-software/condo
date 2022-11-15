import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
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
    SortEmployeesMode,
} from '@condo/domains/scope/utils/clientSchema/utils'

import { useIntl } from '@open-condo/next/intl'
import { Col, FormInstance, Row, Select, Typography } from 'antd'
import { differenceBy } from 'lodash'
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
        const employees = employeeOptions.map(option => option.employee)

        const employeesWithMatchesPropertyAndSpecializationScope = employees.filter(
            isEmployeeSpecializationAndPropertyMatchesToScope(
                categoryClassifier, filteredEmployeeSpecializations, propertyScopes, filteredPropertyScopeEmployees
            )
        )

        const otherEmployees = differenceBy(employees, employeesWithMatchesPropertyAndSpecializationScope, 'id')

        if (employeesWithMatchesPropertyAndSpecializationScope.length > 0) {
            const sortedEmployees = getEmployeesSortedByTicketVisibilityType(
                employeesWithMatchesPropertyAndSpecializationScope,
                filteredEmployeeSpecializations,
                categoryClassifier,
                SortEmployeesMode.MatchedSpecializations
            )
            setMatchedEmployees(sortedEmployees)

            result.push(
                <Select.OptGroup label={EmployeesOnPropertyMessage} key={EmployeesOnPropertyMessage}>
                    {convertEmployeesToOptions(sortedEmployees, intl, filteredEmployeeSpecializations).map(renderOption)}
                </Select.OptGroup>
            )
        } else {
            setMatchedEmployees([])
        }

        if (otherEmployees.length > 0) {
            const sortedEmployees = getEmployeesSortedByTicketVisibilityType(
                otherEmployees,
                filteredEmployeeSpecializations,
                categoryClassifier,
                SortEmployeesMode.All
            )
            const sortedEmployeeOptions = convertEmployeesToOptions(sortedEmployees, intl, filteredEmployeeSpecializations).map(renderOption)

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
    }, [categoryClassifier, filteredEmployeeSpecializations, propertyScopes, filteredPropertyScopeEmployees, EmployeesOnPropertyMessage, intl, OtherMessage])

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

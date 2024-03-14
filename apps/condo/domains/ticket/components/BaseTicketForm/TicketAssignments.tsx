import { Col, FormInstance, Row, Select, Typography } from 'antd'
import { every } from 'lodash'
import { differenceBy } from 'lodash'
import get from 'lodash/get'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { GraphQlSearchInput, renderDeletedOption } from '@condo/domains/common/components/GraphQlSearchInput'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import {
    OrganizationEmployee,
    OrganizationEmployeeSpecialization,
} from '@condo/domains/organization/utils/clientSchema'
import { searchEmployeeUser } from '@condo/domains/organization/utils/clientSchema/search'
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

const isDeletedInitialEmployee = (initialValue, employees) => {
    return initialValue && !employees.some((item) => get(item, 'user.id'))
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
    const DeletedEmployeeMessage = intl.formatMessage({ id: 'global.select.deletedEmployee' })

    const { breakpoints } = useLayoutContext()

    const { assignee: initialAssignee, executor: initialExecutor } = form.getFieldsValue(['assignee', 'executor'])

    const { objs: employees, allDataLoaded: allEmployeesLoaded } = OrganizationEmployee.useAllObjects({
        where: {
            organization: { id: organizationId },
            user: { deletedAt: null },
            deletedAt: null,
            isBlocked: false,
            isRejected: false,
        },
    })

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

    const renderOptionGroups = useCallback((employeeOptions, renderOption) => {
        const result = []

        const employees = employeeOptions
            .map(option => option.employee)
            .filter(employee => employee)

        if (isDeletedInitialEmployee(initialAssignee, employees)) {
            result.push(renderDeletedOption(intl, {
                value: initialAssignee,
                text: DeletedEmployeeMessage,
            }))
        }
        if (isDeletedInitialEmployee(initialExecutor, employees)) {
            result.push(renderDeletedOption(intl, {
                value: initialExecutor,
                text: DeletedEmployeeMessage,
            }))
        }

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
        initialAssignee, initialExecutor, categoryClassifier, filteredEmployeeSpecializations, propertyScopes,
        filteredPropertyScopeEmployees, intl, DeletedEmployeeMessage, EmployeesOnPropertyMessage, OtherMessage,
    ])

    const search = useMemo(() => searchEmployeeUser(intl, organizationId, null),
        [intl, organizationId])

    const loading = propertiesLoading || scopesLoading || employeesLoading || specializationsLoading

    return (
        <Col span={24}>
            <Row gutter={[0, 24]}>
                <Col span={24}>
                    <Typography.Title level={3}>{TicketAssignmentTitle}</Typography.Title>
                </Col>
                <Col span={!breakpoints.TABLET_LARGE ? 24 : 18}>
                    <Row justify='space-between' gutter={[0, 12]}>
                        {
                            autoAssign && !loading && propertyId && categoryClassifier && organizationId && (
                                <AutoAssigner
                                    form={form}
                                    categoryClassifierId={categoryClassifier}
                                    employees={employees}
                                    allDataLoaded={allEmployeesLoaded}
                                    propertyScopeEmployees={filteredPropertyScopeEmployees}
                                    propertyScopes={propertyScopes}
                                    organizationEmployeeSpecializations={filteredEmployeeSpecializations}
                                    organizationId={organizationId}
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

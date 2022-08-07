import { useIntl } from '@condo/next/intl'
import { find, get, differenceBy, uniqBy } from 'lodash'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { Col, FormInstance, Row, Select, Typography } from 'antd'
import { AutoAssignerByDivisions } from './AutoAssignerByDivisions'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { searchEmployeeUser } from '../../utils/clientSchema/search'
import React, { useState } from 'react'
import { Rule } from 'rc-field-form/lib/interface'
import { TicketFormItem } from './index'
import { useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'

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
    autoAssign,
    categoryClassifier,
    form,
}: TicketAssignmentsProps) => {
    const intl = useIntl()
    const TicketAssignmentTitle = intl.formatMessage({ id: 'TicketAssignment' })
    const ExecutorLabel = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleLabel = intl.formatMessage({ id: 'field.Responsible' })
    const ExecutorExtra = intl.formatMessage({ id: 'field.Executor.description' })
    const ResponsibleExtra = intl.formatMessage({ id: 'field.Responsible.description' })
    const ExecutorsOnThisDivisionLabel = intl.formatMessage({ id: 'ticket.assignments.executor.OnThisDivision' })
    const ExecutorsOnOtherDivisionsLabel = intl.formatMessage({ id: 'ticket.assignments.executor.OnOtherDivisions' })
    const OtherExecutors = intl.formatMessage({ id: 'ticket.assignments.executor.Other' })

    const { isSmall } = useLayoutContext()

    const [divisions, setDivisions] = useState([])

    const formatUserFieldLabel = ({ text, value, data: employee }) => {
        if (!employee) {
            return null
        }
        const matchedSpecialization = find(employee.specializations, { id: categoryClassifier })
        return (
            <UserNameField user={{ name: text, id: value }}>
                {({ name, postfix }) => (
                    <>
                        <Typography.Text>
                            {name} {postfix}
                        </Typography.Text>
                        {matchedSpecialization && (
                            <Typography.Text type="secondary">
                                {`(${matchedSpecialization.name.toLowerCase()})`}
                            </Typography.Text>
                        )}
                    </>
                )}
            </UserNameField>
        )
    }

    const getTechniciansFrom = (division) => (
        division.executors.filter(({ specializations }) => (
            specializations.some(({ id }) => id === categoryClassifier)
        ))
    )

    const convertToOption = (employee) => ({
        text: employee.name,
        value: employee.user.id,
        data: employee,
    })

    /**
     * Employees are grouped by following rules:
     * 1. Technicians with matched specialization, belonging to matched division;
     * 2. Technicians with matched specialization, belonging to other matched divisions;
     * 3. Rest of employees.
     */
    const renderOptionGroups = (employeeOptions, renderOption) => {
        const [currentDivision, ...otherDivisions] = divisions
        let techniciansOnDivisionOptions = []
        let techniciansOnOtherDivisionsOptions = []

        if (currentDivision) {
            const techniciansOnDivision = getTechniciansFrom(currentDivision)
            techniciansOnDivisionOptions = techniciansOnDivision.map(convertToOption)

            const techniciansOnOtherDivisions =
                differenceBy(
                    uniqBy(
                        otherDivisions.reduce((acc, otherDivision) => ([
                            ...acc,
                            ...getTechniciansFrom(otherDivision),
                        ]), []),
                        'id',
                    ),
                    techniciansOnDivision,
                    'id',
                )

            techniciansOnOtherDivisionsOptions = techniciansOnOtherDivisions.map(convertToOption)
        }

        const otherTechniciansOptions = differenceBy(employeeOptions, [
            ...techniciansOnDivisionOptions,
            ...techniciansOnOtherDivisionsOptions,
        ], 'value')

        const result = []
        if (!currentDivision || techniciansOnDivisionOptions.length === 0 && techniciansOnOtherDivisionsOptions.length === 0) {
            result.push(otherTechniciansOptions.map(renderOption))
        } else {
            if (techniciansOnDivisionOptions.length > 0) {
                result.push(
                    <Select.OptGroup label={ExecutorsOnThisDivisionLabel}>
                        {techniciansOnDivisionOptions.map(renderOption)}
                    </Select.OptGroup>
                )
            }
            if (techniciansOnOtherDivisionsOptions.length > 0) {
                result.push(
                    <Select.OptGroup label={ExecutorsOnOtherDivisionsLabel}>
                        {techniciansOnOtherDivisionsOptions.map(renderOption)}
                    </Select.OptGroup>
                )
            }
            if (otherTechniciansOptions.length > 0) {
                result.push(
                    <Select.OptGroup label={OtherExecutors}>
                        {otherTechniciansOptions.map(renderOption)}
                    </Select.OptGroup>
                )
            }
        }

        return result
    }

    return (
        <Col span={24}>
            <Row gutter={[0, 8]}>
                <Col span={24}>
                    <Typography.Title level={3}>{TicketAssignmentTitle}</Typography.Title>
                </Col>
                <Col span={isSmall ? 24 : 18}>
                    <Row justify={'space-between'}>
                        {autoAssign && propertyId && (
                            <Col span={24}>
                                <AutoAssignerByDivisions
                                    organizationId={organizationId}
                                    propertyId={propertyId}
                                    categoryClassifier={categoryClassifier}
                                    onDivisionsFound={setDivisions}
                                    form={form}
                                />
                            </Col>
                        )}
                        <Col span={11}>
                            <TicketFormItem
                                name={'executor'}
                                rules={validations.executor}
                                label={<LabelWithInfo title={ExecutorExtra} message={ExecutorLabel}/>}
                            >
                                <GraphQlSearchInput
                                    showArrow={false}
                                    disabled={disableUserInteraction}
                                    formatLabel={formatUserFieldLabel}
                                    renderOptions={renderOptionGroups}
                                    search={searchEmployeeUser(organizationId, ({ role }) => (
                                        get(role, 'canBeAssignedAsExecutor', false)
                                    ))}
                                />
                            </TicketFormItem>
                        </Col>
                        <Col span={11}>
                            <TicketFormItem
                                data-cy={'ticket__assignee-item'}
                                name={'assignee'}
                                rules={validations.assignee}
                                label={<LabelWithInfo title={ResponsibleExtra} message={ResponsibleLabel}/>}
                            >
                                <GraphQlSearchInput
                                    formatLabel={formatUserFieldLabel}
                                    showArrow={false}
                                    disabled={disableUserInteraction}
                                    search={searchEmployeeUser(organizationId, ({ role }) => (
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

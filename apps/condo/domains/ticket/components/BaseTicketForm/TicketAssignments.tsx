import { useIntl } from '@core/next/intl'
import { find, get } from 'lodash'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { Col, Form, Row, Typography } from 'antd'
import { AutoAssignerByDivisions } from './AutoAssignerByDivisions'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { searchEmployeeUser } from '../../utils/clientSchema/search'
import React from 'react'

const TicketAssignments = ({ validations, organizationId, propertyId, disableUserInteraction, autoAssign, categoryClassifier, form }) => {
    const intl = useIntl()
    const TicketAssignmentTitle = intl.formatMessage({ id: 'TicketAssignment' })
    const ExecutorLabel = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleLabel = intl.formatMessage({ id: 'field.Responsible' })
    const ExecutorExtra = intl.formatMessage({ id: 'field.Executor.description' })
    const ResponsibleExtra = intl.formatMessage({ id: 'field.Responsible.description' })

    const formatUserFieldLabel = ({ text, value, data: employee }) => {
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

    return (
        <Col span={24}>
            <Row justify={'space-between'} gutter={[0, 24]}>
                <Col span={24}>
                    <Typography.Title level={5} style={{ margin: '0' }}>{TicketAssignmentTitle}</Typography.Title>
                </Col>
                {autoAssign && propertyId && (
                    <Col span={24}>
                        <AutoAssignerByDivisions
                            organizationId={organizationId}
                            propertyId={propertyId}
                            categoryClassifier={categoryClassifier}
                            form={form}
                        />
                    </Col>
                )}
                <Col span={11}>
                    <Form.Item
                        name={'executor'}
                        rules={validations.executor}
                        label={<LabelWithInfo title={ExecutorExtra} message={ExecutorLabel}/>}
                    >
                        <GraphQlSearchInput
                            formatLabel={formatUserFieldLabel}
                            search={searchEmployeeUser(organizationId, ({ role }) => (
                                get(role, 'canBeAssignedAsExecutor', false)
                            ))}
                            allowClear={false}
                            showArrow={false}
                            disabled={disableUserInteraction}
                        />
                    </Form.Item>
                </Col>
                <Col span={11}>
                    <Form.Item
                        name={'assignee'}
                        rules={validations.assignee}
                        label={<LabelWithInfo title={ResponsibleExtra} message={ResponsibleLabel}/>}
                    >
                        <GraphQlSearchInput
                            formatLabel={formatUserFieldLabel}
                            search={searchEmployeeUser(organizationId, ({ role }) => (
                                get(role, 'canBeAssignedAsResponsible', false)
                            ))}
                            allowClear={false}
                            showArrow={false}
                            disabled={disableUserInteraction}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Col>
    )
}

export {
    TicketAssignments,
}
import { Col, Row, Skeleton, Tag, Typography } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { useQuery } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Button } from '@condo/domains/common/components/Button'
import { GET_ALL_EMPLOYEE_ORGANIZATIONS_QUERY } from '@condo/domains/organization/gql'
import { useAuth } from '@core/next/auth'

const OrganizationName = ({ name, organizationId, employeeOrganizationId, selectOrganization }) => {
    if (organizationId === employeeOrganizationId) {
        return (<Typography.Text style={{ fontSize: '16px', fontWeight: 'bold' }}>{ name }</Typography.Text>)
    }

    return (
        <Typography.Text style={{ fontSize: '16px' }}>
            { name } ({ <Button type={'inlineLink'} onClick={selectOrganization}>войти</Button> })
        </Typography.Text>
    )
}

const OrganizationEmployeeItem = ({ employee, employeeOrganizationData }) => {
    const intl = useIntl()
    const employeeOrganizationId = get(employeeOrganizationData, ['link', 'organization', 'id'])

    const OrganizationMessage = intl.formatMessage({ id: 'pages.condo.property.field.Organization' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })

    const selectOrganization = useCallback(() => {
        employeeOrganizationData.selectLink(employee)
    }, [])

    if (!employee.isAccepted) {
        return null
    }

    return (
        <Col span={24}>
            <Row gutter={[0, 24]}>
                <Col span={3}>
                    <Typography.Text type='secondary'>
                        {OrganizationMessage}
                    </Typography.Text>
                </Col>
                <Col span={19} push={2}>
                    <NotDefinedField
                        value={get(employee, ['organization', 'name'])}
                        render={(name) => (
                            <OrganizationName
                                name={name}
                                organizationId={get(employee, ['organization', 'id'])}
                                employeeOrganizationId={employeeOrganizationId}
                                selectOrganization={selectOrganization}
                            />
                        )}
                    />
                </Col>
                <Col span={3}>
                    <Typography.Text type='secondary'>
                        {PositionMessage}
                    </Typography.Text>
                </Col>
                <Col span={19} push={2}>
                    <NotDefinedField value={get(employee, ['role', 'position'])}/>
                </Col>
                <Col span={3}>
                    <Typography.Text type='secondary'>
                        {RoleMessage}
                    </Typography.Text>
                </Col>
                <Col span={19} push={2}>
                    <NotDefinedField
                        value={get(employee, ['role', 'name'])}
                        render={(roleName) => (<Tag color='default'>{roleName}</Tag>)}
                    />
                </Col>
            </Row>
        </Col>
    )
}

export const UserOrganizationsList: React.FC = () => {
    const { user } = useAuth()
    const userId = get(user, 'id')
    const employeeOrganizationData = useOrganization()

    const { data, loading } = useQuery(GET_ALL_EMPLOYEE_ORGANIZATIONS_QUERY, {
        variables: { where: { user: { id: userId } } },
    })

    const employeeOrganizationId = get(employeeOrganizationData, ['link', 'organization', 'id'])

    const list = useMemo(() => {
        return  get(data, 'objs', []).map((employee, index) => (
            <OrganizationEmployeeItem
                employee={employee}
                key={index}
                employeeOrganizationData={employeeOrganizationData}
            />
        ))
    }, [employeeOrganizationId])

    return (
        <Row gutter={[0, 60]}>
            {
                loading
                    ? <Skeleton active/>
                    : list
            }
        </Row>
    )
}


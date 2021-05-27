import { Col, Row, Skeleton, Tag, Typography } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useMemo } from 'react'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Button } from '@condo/domains/common/components/Button'
import { useAuth } from '@core/next/auth'
import { OrganizationEmployee as OrganizationEmployeeType } from '../../../schema'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

interface IOrganizationName {
    name: string
    organizationId: string
    employeeOrganizationId: string
    selectOrganization: () => void
}

const OrganizationName: React.FC<IOrganizationName> = (props) => {
    const intl = useIntl()
    const EnterMessage = intl.formatMessage({ id: 'SignIn' })

    const {
        name,
        organizationId,
        employeeOrganizationId,
        selectOrganization,
    } = props

    if (organizationId === employeeOrganizationId) {
        return (<Typography.Text style={{ fontSize: '16px', fontWeight: 'bold' }}>{ name }</Typography.Text>)
    }

    return (
        <Typography.Text style={{ fontSize: '16px' }}>
            { name } ({ <Button type={'inlineLink'} onClick={selectOrganization}>{ EnterMessage }</Button> })
        </Typography.Text>
    )
}

interface IOrganizationEmployeeItem {
    employee: OrganizationEmployeeType
    employeeOrganizationData
}

const OrganizationEmployeeItem: React.FC<IOrganizationEmployeeItem> = (props) => {
    const intl = useIntl()
    const OrganizationMessage = intl.formatMessage({ id: 'pages.condo.property.field.Organization' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })

    const { employee, employeeOrganizationData } = props

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
                                employeeOrganizationId={get(employeeOrganizationData, ['link', 'organization', 'id'])}
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
    const employeeOrganizationData = useOrganization()

    const { objs: userOrganizations, loading } = OrganizationEmployee.useObjects(
        { where: user ? { user: { id: user.id }, isAccepted: true } : {} },
        { fetchPolicy: 'network-only' }
    )

    console.log(userOrganizations)

    const employeeOrganizationId = get(employeeOrganizationData, ['link', 'organization', 'id'])

    const list = useMemo(() => {
        return  userOrganizations.map((employee, index) => (
            <OrganizationEmployeeItem
                employee={employee}
                key={index}
                employeeOrganizationData={employeeOrganizationData}
            />
        ))
    }, [loading])

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

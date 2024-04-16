import { OrganizationEmployee as OrganizationEmployeeType } from '@app/condo/schema'
import { Col, Row, Skeleton } from 'antd'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Tag } from '@open-condo/ui'

import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'


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
        return (<Typography.Text strong>{name}</Typography.Text>)
    }

    return (
        <Typography.Text>
            {name} (<Typography.Link onClick={selectOrganization}>{EnterMessage}</Typography.Link>)
        </Typography.Text>
    )
}

interface IOrganizationEmployeeItem {
    employee: OrganizationEmployeeType
    userOrganization
}

const OrganizationEmployeeItem: React.FC<IOrganizationEmployeeItem> = (props) => {
    const intl = useIntl()
    const OrganizationMessage = intl.formatMessage({ id: 'pages.condo.property.field.Organization' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })

    const { employee, userOrganization } = props

    const selectOrganization = useCallback(() => {
        userOrganization.selectLink(employee)
    }, [])

    if (!employee.isAccepted) {
        return null
    }

    return (
        <Col span={24}>
            <Row gutter={[0, 24]}>
                <Col lg={5} xs={10}>
                    <Typography.Text type='secondary'>
                        {OrganizationMessage}
                    </Typography.Text>
                </Col>
                <Col lg={18} xs={12} offset={1}>
                    <NotDefinedField
                        value={get(employee, ['organization', 'name'])}
                        render={(name) => (
                            <OrganizationName
                                name={String(name)}
                                organizationId={get(employee, ['organization', 'id'])}
                                employeeOrganizationId={get(userOrganization, ['link', 'organization', 'id'])}
                                selectOrganization={selectOrganization}
                            />
                        )}
                    />
                </Col>
                <Col lg={5} xs={10}>
                    <Typography.Text type='secondary'>
                        {PositionMessage}
                    </Typography.Text>
                </Col>
                <Col lg={18} xs={12} offset={1}>
                    <NotDefinedField value={get(employee, ['position'])}/>
                </Col>
                <Col lg={5} xs={10}>
                    <Typography.Text type='secondary'>
                        {RoleMessage}
                    </Typography.Text>
                </Col>
                <Col lg={18} xs={12} offset={1}>
                    <NotDefinedField
                        value={get(employee, ['role', 'name'])}
                        render={(roleName) => (<Tag children={roleName as string} />)}
                    />
                </Col>
            </Row>
        </Col>
    )
}

export const UserOrganizationsList = ({ userOrganization, organizationEmployeesQuery }) => {
    const { objs: userOrganizations, allDataLoaded } = OrganizationEmployee.useAllObjects(
        organizationEmployeesQuery,
        { fetchPolicy: 'network-only' }
    )

    const list = useMemo(() => {
        return uniqBy(userOrganizations, employee => get(employee, 'organization.id')).slice()
            .sort((optionA, optionB) =>
                get(optionA, 'organization.name', '').toLowerCase().localeCompare(get(optionB, 'organization.name', '').toLowerCase())
            )
            .map((employee, index) => (
                <OrganizationEmployeeItem
                    employee={employee}
                    key={index}
                    userOrganization={userOrganization}
                />
            ))
    }, [userOrganization, userOrganizations])

    return (
        <Row gutter={[0, 60]}>
            {
                !allDataLoaded
                    ? <Skeleton active/>
                    : list
            }
        </Row>
    )
}

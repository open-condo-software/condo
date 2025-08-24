import { Col, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import Link from 'next/link'
import React from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Typography } from '@open-condo/ui'

import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { UserOrganizationsList, UserOrganizationsListProps } from '@condo/domains/user/components/UserOrganizationsList'


const ROW_GUTTER_BIG: [Gutter, Gutter] = [0, 60]
const ROW_GUTTER_MID: [Gutter, Gutter] = [0, 40]

export type UserInfoContentProps = {
    useAllOrganizationEmployee: UserOrganizationsListProps['useAllOrganizationEmployee']
}

export const UserInfoContent: React.FC<UserInfoContentProps> = ({ useAllOrganizationEmployee }) => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })

    const { user } = useAuth()

    const email = user?.email || '—'
    const phone = user?.phone || '—'

    return (
        <Row gutter={ROW_GUTTER_BIG}>
            <Col span={24}>
                <Row gutter={ROW_GUTTER_MID} justify='center'>
                    <Col span={24}>
                        <Row gutter={ROW_GUTTER_BIG}>
                            <Col span={24}>
                                <Row gutter={ROW_GUTTER_MID}>
                                    <Col span={24}>
                                        <Row gutter={[0, 16]}>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {PhoneMessage}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={18} xs={10} offset={1}>
                                                <NotDefinedField value={phone}/>
                                            </Col>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {EmailMessage}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={18} xs={10} offset={1}>
                                                <NotDefinedField value={email}/>
                                            </Col>
                                            <Col lg={5} xs={10}>
                                                <Typography.Text type='secondary'>
                                                    {PasswordMessage}
                                                </Typography.Text>
                                            </Col>
                                            <Col lg={18} xs={10} offset={1}>
                                                <NotDefinedField value='******'/>
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <UserOrganizationsList
                                    useAllOrganizationEmployee={useAllOrganizationEmployee}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Col>
            <Col span={24}>
                <ActionBar
                    actions={[
                        <Link key='update' href='/user/update'>
                            <Button
                                type='primary'
                            >
                                {UpdateMessage}
                            </Button>
                        </Link>,
                    ]}
                />
            </Col>
        </Row>
    )
}

import { EditFilled } from '@ant-design/icons'
import { Col, Row, Space, Typography } from 'antd'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { Button } from '@condo/domains/common/components/Button'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { UserOrganizationsList } from '@condo/domains/user/components/UserOrganizationsList'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'

export const UserInfoPage = () => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })

    const { user } = useAuth()

    const name = get(user, 'name')

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <OrganizationRequired>
                        <Row gutter={[0, 40]}>
                            <Col span={3}>
                                <UserAvatar borderRadius={24}/>
                            </Col>
                            <Col span={20} push={1}>
                                <Row gutter={[0, 60]}>
                                    <Col span={24}>
                                        <Row gutter={[0, 40]}>
                                            <Col span={24}>
                                                <Typography.Title
                                                    level={1}
                                                    style={{ margin: 0, fontWeight: 'bold' }}
                                                >
                                                    {name}
                                                </Typography.Title>
                                            </Col>
                                            <Col span={24}>
                                                <Row gutter={[0, 24]}>
                                                    <Col span={3}>
                                                        <Typography.Text type='secondary'>
                                                            {PhoneMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col span={19} push={2}>
                                                        <NotDefinedField value={get(user, 'phone')}/>
                                                    </Col>

                                                    <Col span={3}>
                                                        <Typography.Text type='secondary'>
                                                            {EmailMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col span={19} push={2}>
                                                        <NotDefinedField value={get(user, 'email')}/>
                                                    </Col>

                                                    <Col span={3}>
                                                        <Typography.Text type='secondary'>
                                                            {PasswordMessage}
                                                        </Typography.Text>
                                                    </Col>
                                                    <Col span={19} push={2}>
                                                        <NotDefinedField value='******'/>
                                                    </Col>
                                                </Row>
                                            </Col>
                                            <Col span={24}>
                                                <Link href={'/user/update'}>
                                                    <Button
                                                        color={'green'}
                                                        type={'sberPrimary'}
                                                        secondary
                                                        icon={<EditFilled />}
                                                    >
                                                        {UpdateMessage}
                                                    </Button>
                                                </Link>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <UserOrganizationsList/>
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </OrganizationRequired>
                </PageContent>
            </PageWrapper>
        </>
    )
}

const HeaderAction = () => {
    const intl = useIntl()

    return (
        <Space>
            <Typography.Text style={{ fontSize: '12px' }}>
                {intl.formatMessage({ id: 'Account' })}
            </Typography.Text>
        </Space>
    )
}

UserInfoPage.headerAction = <HeaderAction/>

export default UserInfoPage
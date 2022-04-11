import { EditFilled } from '@ant-design/icons'
import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import Link from 'next/link'
import React, { useEffect } from 'react'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { Button } from '@condo/domains/common/components/Button'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { PageContent, PageWrapper, useLayoutContext } from '@condo/domains/common/components/containers/BaseLayout'
import { UserOrganizationsList } from '@condo/domains/user/components/UserOrganizationsList'
import { NotDefinedField } from '@condo/domains/user/components/NotDefinedField'
import { AuthRequired } from '@condo/domains/common/components/containers/AuthRequired'
import { useOrganization } from '@core/next/organization'
import { FeatureFlagsController } from '@condo/domains/common/components/containers/FeatureFlag'

export const UserInfoPage = () => {
    const intl = useIntl()
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const PasswordMessage = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const UpdateMessage = intl.formatMessage({ id: 'Edit' })

    const { user, refetch } = useAuth()
    const userOrganization = useOrganization()
    const { isSmall } = useLayoutContext()

    useEffect(() => {
        refetch()
    }, [])

    const name = get(user, 'name')
    const email = get(user, 'email', '')

    return (
        <>
            <Head>
                <title>{name}</title>
            </Head>
            <FeatureFlagsController/>
            <PageWrapper>
                <PageContent>
                    <Row gutter={[0, 40]} justify={'center'}>
                        <Col xs={10} lg={3}>
                            <UserAvatar borderRadius={24}/>
                        </Col>
                        <Col xs={24} lg={20} offset={ isSmall ? 0 : 1}>
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
                                                <Col lg={3} xs={10}>
                                                    <Typography.Text type='secondary'>
                                                        {PhoneMessage}
                                                    </Typography.Text>
                                                </Col>
                                                <Col lg={19} xs={10} offset={2}>
                                                    <NotDefinedField value={get(user, 'phone')}/>
                                                </Col>
                                                {
                                                    email && <>
                                                        <Col lg={3} xs={10}>
                                                            <Typography.Text type='secondary'>
                                                                {EmailMessage}
                                                            </Typography.Text>
                                                        </Col>
                                                        <Col lg={19} xs={10} offset={2}>
                                                            <NotDefinedField value={get(user, 'email')}/>
                                                        </Col>
                                                    </>
                                                }
                                                <Col lg={3} xs={10}>
                                                    <Typography.Text type='secondary'>
                                                        {PasswordMessage}
                                                    </Typography.Text>
                                                </Col>
                                                <Col lg={19} xs={10} offset={2}>
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
                                    {
                                        userOrganization
                                            ? (<UserOrganizationsList userOrganization={userOrganization}/>)
                                            : null
                                    }
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

UserInfoPage.requiredAccess = AuthRequired

export default UserInfoPage
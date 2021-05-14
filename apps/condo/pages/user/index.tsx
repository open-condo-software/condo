import { Col, Row, Space, Typography } from 'antd'
import Head from 'next/head'
import React from 'react'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { PageContent, PageWrapper } from '../../domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '../../domains/organization/components/OrganizationRequired'
import { UserAvatar } from '../../domains/user/components/UserAvatar'

export const UserInfoPage = () => {
    const { user } = useAuth()
    
    const phone = get(user, 'phone')
    const email = get(user, 'email')
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
                                <Typography.Title level={1}>{name}</Typography.Title>
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
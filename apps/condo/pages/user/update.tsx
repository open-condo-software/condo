import { ArrowLeftOutlined } from '@ant-design/icons'
import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import React from 'react'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { LinkWithIcon } from '@condo/domains/common/components/LinkWithIcon'
import { colors } from '@condo/domains/common/constants/style'
import { UserProfileForm } from '@condo/domains/user/components/UserProfileForm'

export const UserInfoPage = () => {
    const intl = useIntl()
    const ProfileUpdateTitle = intl.formatMessage({ id: 'profile.Update' })

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
                        <Row>
                            <Col span={3}>
                                <UserAvatar borderRadius={24}/>
                            </Col>
                            <Col span={20} push={1}>
                                <Row gutter={[0, 40]}>
                                    <Col span={24}>
                                        <Typography.Title
                                            level={1}
                                            style={{ margin: 0, fontWeight: 'bold' }}
                                        >
                                            {ProfileUpdateTitle}

                                        </Typography.Title>
                                    </Col>
                                    <Col span={24}>
                                        <UserProfileForm/>
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
    const AllTicketsMessage = intl.formatMessage({ id: 'Back' })

    return (
        <LinkWithIcon
            icon={<ArrowLeftOutlined style={{ color: colors.white }}/>}
            path={'/user/'}
        >
            {AllTicketsMessage}
        </LinkWithIcon>
    )
}

UserInfoPage.headerAction = <HeaderAction/>

export default UserInfoPage

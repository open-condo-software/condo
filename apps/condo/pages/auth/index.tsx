import { Col, Row } from 'antd'
import Head from 'next/head'
import Router from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { PageComponentType } from '@condo/domains/common/types'
import { AuthButton } from '@condo/domains/user/components/auth/AuthButton'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'


const AuthPage: PageComponentType = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })
    const IAmResidentMessage = intl.formatMessage({ id: 'pages.auth.IAmResident' })
    const IAmOrganizationRepresentativeMessage = intl.formatMessage({ id: 'pages.auth.IAmOrganizationRepresentative' })
    // todo(DOMA-9722): move platformName to envs
    const WelcomeMessage = intl.formatMessage({ id: 'pages.auth.Welcome' }, { productName: 'Doma.ai' })

    return (
        <>
            <Head><title>{SignInTitleMsg}</title></Head>
            <Row justify='center' gutter={[0, 40]}>
                <ResponsiveCol desktopWidth={350}>
                    <Row gutter={[0, 40]}>
                        <Col span={24}>
                            <Typography.Title level={2}>
                                {WelcomeMessage}
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[0, 24]}>
                                <Col span={24}>
                                    <AuthButton type='secondary' block onClick={() => Router.replace('/auth/resident')}>
                                        {IAmResidentMessage}
                                    </AuthButton>
                                </Col>
                                <Col span={24}>
                                    <AuthButton type='secondary' block onClick={() => Router.replace('/auth/register')}>
                                        {IAmOrganizationRepresentativeMessage}
                                    </AuthButton>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </ResponsiveCol>
            </Row>
        </>
    )
}
AuthPage.container = AuthLayout
AuthPage.skipUserPrefetch = true

export default AuthPage

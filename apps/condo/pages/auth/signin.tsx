import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { SignInForm } from '@condo/domains/user/components/auth/SignInForm'
import { useIntl } from '@core/next/intl'
import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import React from 'react'
import { ButtonHeaderActions, TabsAuthAction } from '@condo/domains/common/components/HeaderActions'

const SignInPage: AuthPage = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })

    return (
        <>
            <Row>
                <Col span={24}>
                    <TabsAuthAction currentActiveKey={'/auth/signin'}/>
                </Col>
                <Col span={24}>
                    <SignInForm />
                </Col>
            </Row>
        </>
    )
}


SignInPage.container = AuthLayout

export default SignInPage

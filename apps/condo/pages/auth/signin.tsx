import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { SignInForm } from '@condo/domains/user/components/auth/SignInForm'
import { useIntl } from '@core/next/intl'
import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import React from 'react'
import { ButtonHeaderAction } from '@condo/domains/common/components/HeaderActions'

const SignInPage: AuthPage = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })

    return (
        <>
            <Head>
                <title>{SignInTitleMsg}</title>
            </Head>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Typography.Title>{SignInTitleMsg}</Typography.Title>
                </Col>
                <Col span={24}>
                    <SignInForm />
                </Col>
            </Row>
        </>
    )
}

SignInPage.headerAction = <ButtonHeaderAction descriptor={{ id: 'pages.auth.Register' }} path={'/auth/register'} />

SignInPage.container = AuthLayout

export default SignInPage

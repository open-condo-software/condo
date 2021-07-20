import { Button } from '@condo/domains/common/components/Button'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { AuthLayoutContext } from '@condo/domains/user/components/containers/AuthLayoutContext'
import { SignInForm } from '@condo/domains/user/components/auth/SignInForm'
import { useIntl } from '@core/next/intl'
import { Col, Row, Typography } from 'antd'
import Head from 'next/head'
import Router from 'next/router'
import React, { useContext } from 'react'

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

const HeaderAction: React.FC = () => {
    const intl = useIntl()
    const RegisterTitle = intl.formatMessage({ id: 'pages.auth.Register' })
    const { isMobile } = useContext(AuthLayoutContext)

    return (
        <Button
            key='submit'
            onClick={() => Router.push('/auth/register')}
            type='sberPrimary'
            secondary={true}
            size={isMobile ? 'middle' : 'large'}
        >
            {RegisterTitle}
        </Button>
    )
}

SignInPage.headerAction = <HeaderAction />

SignInPage.container = AuthLayout

export default SignInPage

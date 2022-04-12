import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { SignInForm } from '@condo/domains/user/components/auth/SignInForm'
import { Col, Row } from 'antd'
import React from 'react'
import { TabsAuthAction } from '@condo/domains/common/components/HeaderActions'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'
import Head from 'next/head'
import { useIntl } from 'react-intl'

const SignInPage: AuthPage = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'SignIn' })

    return (
        <>
            <Head><title>{SignInTitleMsg}</title></Head>
            <Row justify={'center'}>
                <Col span={16}>
                    <TabsAuthAction currentActiveKey={'/auth/signin'}/>
                </Col>
                <Col span={24}>
                    <SignInForm/>
                </Col>
            </Row>
        </>
    )
}
SignInPage.container = AuthLayout
SignInPage.headerAction = <WelcomeHeaderTitle/>
export default SignInPage
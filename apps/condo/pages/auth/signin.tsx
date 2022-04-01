import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { SignInForm } from '@condo/domains/user/components/auth/SignInForm'
import { Col, Row } from 'antd'
import React from 'react'
import { TabsAuthAction } from '@condo/domains/common/components/HeaderActions'

const SignInPage: AuthPage = () => {
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

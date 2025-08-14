import { Col, Row } from 'antd'
import { setCookie } from 'cookies-next'
import Head from 'next/head'
import React from 'react'

import { useEffectOnce } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'

import { TabsAuthAction } from '@condo/domains/common/components/HeaderActions'
import { COOKIE_MAX_AGE_IN_SEC } from '@condo/domains/common/constants/cookies'
import { PageComponentType } from '@condo/domains/common/types'
import { SignInForm } from '@condo/domains/user/components/auth/SignInForm'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'
import { AUTH_FLOW_USER_TYPE_COOKIE_NAME } from '@condo/domains/user/constants/auth'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'


const SignInPage: PageComponentType = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.signin.title' })

    const { authMethods } = useAuthMethods()

    useEffectOnce(() => {
        setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, 'staff', { maxAge: COOKIE_MAX_AGE_IN_SEC })
    })

    return (
        <>
            <Head><title>{SignInTitleMsg}</title></Head>
            <Row>
                <Col>
                    {
                        (authMethods.phonePassword || authMethods.emailPassword) && (
                            <Row justify='center'>
                                <Col>
                                    <TabsAuthAction currentActiveKey='signin'/>
                                </Col>
                            </Row>
                        )
                    }
                    <SignInForm/>
                </Col>
            </Row>
        </>
    )
}

const HeaderAction: React.FC = () => {
    const { authFlow } = useAuthMethods()

    if (authFlow !== 'default') return null

    return <WelcomeHeaderTitle userType='staff'/>

}

SignInPage.container = AuthLayout
SignInPage.headerAction = <HeaderAction/>
SignInPage.skipUserPrefetch = true

export default SignInPage

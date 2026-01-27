import { Col, Row } from 'antd'
import { setCookie } from 'cookies-next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useEffectOnce } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'

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

    useEffectOnce(() => {
        setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, 'staff', { maxAge: COOKIE_MAX_AGE_IN_SEC })
    })

    return (
        <>
            <Head><title>{SignInTitleMsg}</title></Head>
            <Row>
                <Col>
                    <SignInForm/>
                </Col>
            </Row>
        </>
    )
}

const HeaderAction: React.FC = () => {
    const router = useRouter()
    const { query: { authStep } } = router

    const { authFlow } = useAuthMethods()

    if (authFlow !== 'default') return null
    if (authStep === 'secondFactor') return null

    return <WelcomeHeaderTitle userType='staff'/>

}

SignInPage.container = AuthLayout
SignInPage.headerAction = <HeaderAction/>
SignInPage.skipUserPrefetch = true

export default SignInPage

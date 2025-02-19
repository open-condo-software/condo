import { Col, Row } from 'antd'
import { getCookie, setCookie } from 'cookies-next'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { COOKIE_MAX_AGE_IN_SEC } from '@condo/domains/common/constants/cookies'
import { PageComponentType } from '@condo/domains/common/types'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { AuthButton } from '@condo/domains/user/components/auth/AuthButton'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { AUTH_FLOW_USER_TYPE_COOKIE_NAME, WAS_AUTHENTICATED_COOKIE_NAME } from '@condo/domains/user/constants/auth'


const {
    publicRuntimeConfig: {
        residentAppInfo,
    },
} = getConfig()

const AuthPage: PageComponentType = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })
    const IAmResidentMessage = intl.formatMessage({ id: 'pages.auth.IAmResident' })
    const IAmOrganizationRepresentativeMessage = intl.formatMessage({ id: 'pages.auth.IAmOrganizationRepresentative' })
    const WelcomeMessage = intl.formatMessage({ id: 'pages.auth.Welcome' })

    const router = useRouter()
    const { query: { next } } = router
    const isValidNextUrl = next && !Array.isArray(next) && isSafeUrl(next)

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
                                    <AuthButton type='secondary' block onClick={async () => {
                                        setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, 'resident', { maxAge: COOKIE_MAX_AGE_IN_SEC })
                                        await router.replace('/auth/resident')
                                    }}>
                                        {IAmResidentMessage}
                                    </AuthButton>
                                </Col>
                                <Col span={24}>
                                    <AuthButton type='secondary' block onClick={async () => {
                                        setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, 'staff', { maxAge: COOKIE_MAX_AGE_IN_SEC })
                                        await router.replace(isValidNextUrl ? `/auth/register?next=${encodeURIComponent(next)}` : '/auth/register')
                                    }}>
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
AuthPage.getPrefetchedData = async ({ context }) => {
    const hasResidentApp = residentAppInfo?.mobile?.help && residentAppInfo?.mobile?.download

    const userType = getCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, { req: context?.req, res: context?.res })
    const wasAuthenticated = getCookie(WAS_AUTHENTICATED_COOKIE_NAME, { req: context?.req, res: context?.res })

    const next = context?.query?.next
    const isValidNext = !Array.isArray(next) && isSafeUrl(next)

    let nextUrl = null
    if (wasAuthenticated) {
        nextUrl = isValidNext ? `/auth/signin?next=${encodeURIComponent(next)}` : '/auth/signin'
    } else if (userType === 'staff') {
        nextUrl = isValidNext ? `/auth/register?next=${encodeURIComponent(next)}&step=inputPhone` : '/auth/register?step=inputPhone'
    } else if (!hasResidentApp) {
        nextUrl = isValidNext ? `/auth/register?next=${encodeURIComponent(next)}&step=inputPhone` : '/auth/register?step=inputPhone'
    } else if (userType === 'resident') {
        nextUrl = '/auth/resident'
    }

    if (nextUrl) {
        return {
            redirect: {
                destination: nextUrl,
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}

export default AuthPage

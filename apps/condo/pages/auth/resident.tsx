import { Col, Row } from 'antd'
import { setCookie } from 'cookies-next'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'

import { useEffectOnce } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { COOKIE_MAX_AGE_IN_SEC } from '@condo/domains/common/constants/cookies'
import { PageComponentType } from '@condo/domains/common/types'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'
import { AUTH_FLOW_USER_TYPE_COOKIE_NAME } from '@condo/domains/user/constants/auth'


const ResidentAuthPage: PageComponentType = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })
    // TODO(DOMA-9722): add translations

    useEffectOnce(() => {
        setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, 'resident', { maxAge: COOKIE_MAX_AGE_IN_SEC })
    })

    return (
        <>
            <Head><title>{SignInTitleMsg}</title></Head>

            {/* TODO(DOMA-9722): use css styles */}
            <Row justify='center' style={{ maxWidth: 422 }} gutter={[0, 48]}>
                <Col span={24}>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Typography.Title level={2}>
                                Мобильное приложение жителя
                            </Typography.Title>
                        </Col>
                        <Col span={24}>
                            <Typography.Text>
                                Оплачивайте квитанции, сдавайте показания счетчиков и&nbsp;отправляйте заявки в управляющую организацию
                            </Typography.Text>
                        </Col>
                    </Row>
                </Col>
                <Col span={24}>
                    <Row gutter={[0, 48]}>
                        <Col span={24}>
                            <Row justify='center'>
                                <Col>
                                    Qr code
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row justify='center'>
                                {/* TODO(DOMA-9722): use css styles */}
                                <Col style={{ padding: 16, background: '#F2F4F6', borderRadius: 4, textAlign: 'center' }}>
                                    <Typography.Text size='medium'>
                                        Наведите камеру вашего телефона на QR-код или скачайте приложение по <Link href='#'>ссылке</Link>
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </>
    )
}

ResidentAuthPage.container = AuthLayout
ResidentAuthPage.headerAction = <WelcomeHeaderTitle userType='resident' />
ResidentAuthPage.skipUserPrefetch = true

export default ResidentAuthPage

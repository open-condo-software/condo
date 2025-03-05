import { QRCodeCanvas } from '@rc-component/qrcode'
import { Col, Row } from 'antd'
import { setCookie } from 'cookies-next'
import Head from 'next/head'
import React from 'react'

import { useEffectOnce } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { COOKIE_MAX_AGE_IN_SEC } from '@condo/domains/common/constants/cookies'
import { PageComponentType } from '@condo/domains/common/types'
import { InfoBlock } from '@condo/domains/user/components/auth/InfoBlock'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'
import { AUTH_FLOW_USER_TYPE_COOKIE_NAME } from '@condo/domains/user/constants/auth'


const ResidentAuthPage: PageComponentType = () => {
    const intl = useIntl()
    const ResidentAuthTitle = intl.formatMessage({ id: 'pages.auth.resident.title' })
    const ResidentAuthDescription = intl.formatMessage({ id: 'pages.auth.resident.description' })
    const LinkDativeMessage = intl.formatMessage({ id: 'pages.auth.resident.qrCode.info.link.dative' })
    const QRCodeInfoMessage = intl.formatMessage({ id: 'pages.auth.resident.qrCode.info' }, {
        link: (
            <Typography.Link href='https://help.doma.ai/article/171-doma' target='_blank'>
                {LinkDativeMessage}
            </Typography.Link>
        ),
    })
    // TODO(DOMA-9722): REMOVE HARDCODE

    useEffectOnce(() => {
        setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, 'resident', { maxAge: COOKIE_MAX_AGE_IN_SEC })
    })

    return (
        <>
            <Head><title>{ResidentAuthTitle}</title></Head>

            <Row justify='center'>
                <ResponsiveCol desktopWidth='422px' span={24}>
                    <Row justify='center' gutter={[0, 48]}>
                        <Col span={24}>
                            <Row gutter={[0, 24]}>
                                <Col span={24}>
                                    <Typography.Title level={2}>
                                        {ResidentAuthTitle}
                                    </Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Typography.Text>
                                        {ResidentAuthDescription}
                                    </Typography.Text>
                                </Col>
                            </Row>
                        </Col>

                        <Col span={24}>
                            <Row gutter={[0, 48]}>
                                <Col span={24}>
                                    <Row justify='center'>
                                        <Col>
                                            {/* TODO(DOMA-9722): remove hardcode */}
                                            <QRCodeCanvas
                                                value='https://redirect.appmetrica.yandex.com/serve/1181330335116320672'
                                                size={168}
                                                level='M'
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <InfoBlock>
                                        <Typography.Text size='medium'>
                                            {QRCodeInfoMessage}
                                        </Typography.Text>
                                    </InfoBlock>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </ResponsiveCol>
            </Row>
        </>
    )
}

ResidentAuthPage.container = AuthLayout
ResidentAuthPage.headerAction = <WelcomeHeaderTitle userType='resident' />
ResidentAuthPage.skipUserPrefetch = true

export default ResidentAuthPage

import { QRCodeCanvas } from '@rc-component/qrcode'
import { Col, Row } from 'antd'
import { setCookie } from 'cookies-next'
import getConfig from 'next/config'
import Head from 'next/head'
import React from 'react'

import { useEffectOnce } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { COOKIE_MAX_AGE_IN_SEC } from '@condo/domains/common/constants/cookies'
import { PageComponentType } from '@condo/domains/common/types'
import { InfoBlock } from '@condo/domains/user/components/auth/InfoBlock'
import AuthLayout from '@condo/domains/user/components/containers/AuthLayout'
import { ResponsiveCol } from '@condo/domains/user/components/containers/ResponsiveCol'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'
import { AUTH_FLOW_USER_TYPE_COOKIE_NAME } from '@condo/domains/user/constants/auth'


const {
    publicRuntimeConfig: {
        residentAppInfo,
    },
} = getConfig()

const ResidentAuthPage: PageComponentType = () => {
    const intl = useIntl()
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })
    const ResidentAuthTitle = intl.formatMessage({ id: 'pages.auth.resident.title' })
    const ResidentAuthDescription = intl.formatMessage({ id: 'pages.auth.resident.description' })
    const LinkDativeMessage = intl.formatMessage({ id: 'pages.auth.resident.qrCode.info.link.dative' })
    const QRCodeInfoMessage = intl.formatMessage({ id: 'pages.auth.resident.qrCode.info' }, {
        link: (
            <Typography.Link href={residentAppInfo?.mobile?.help || '#'} target='_blank'>
                {LinkDativeMessage}
            </Typography.Link>
        ),
    })

    useEffectOnce(() => {
        setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, 'resident', { maxAge: COOKIE_MAX_AGE_IN_SEC })
    })

    if (!residentAppInfo?.mobile?.help || !residentAppInfo?.mobile?.download) {
        return <LoadingOrErrorPage title={ResidentAuthTitle} loading={false} error={ServerErrorMessage}/>
    }

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
                                            <QRCodeCanvas
                                                value={residentAppInfo.mobile.download}
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

ResidentAuthPage.getPrefetchedData = async () => {
    if (!residentAppInfo?.mobile?.help || !residentAppInfo?.mobile?.download) {
        return {
            redirect: {
                destination: '/auth',
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}

export default ResidentAuthPage

import { Global } from '@emotion/react'
import { Col, Row  } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { Typography } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import { FROM_INPUT_CSS } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { HCaptchaProvider } from '@condo/domains/common/components/HCaptcha'
import { Logo } from '@condo/domains/common/components/Logo'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'

import { Layout } from './styles'

import './AuthLayout.css'


const {
    publicRuntimeConfig: { HelpRequisites: { support_email: SUPPORT_EMAIL = null, support_phone: SUPPORT_PHONE = null } },
} = getConfig()


export type AuthLayoutProps = {
    headerAction: React.ReactElement
    children: JSX.Element
}

type AuthPosterProps = {
    AuthHeader: JSX.Element
}

// TODO(DOMA-9722): add translations
const AuthPoster: React.FC<AuthPosterProps> = ({ AuthHeader }) => {
    return (
        <div className='auth-poster'>
            <div className='auth-poster-content'>
                <Row gutter={[0, 60]}>
                    <Col span={24} className='auth-poster-header'>
                        {AuthHeader}
                    </Col>
                    <Col span={24} className='auth-poster-text'>
                        <Row gutter={[0, 20]}>
                            <Col span={24}>
                                <Typography.Title level={3}>
                                    Сокращайте расходы, улучшайте процессы и&nbsp;отношения с жителями
                                </Typography.Title>
                            </Col>
                            <Col span={24}>
                                <Typography.Text>
                                    Онлайн-платформа для управляющих <br/>компаний, ТСН, ТСЖ, РСО
                                </Typography.Text>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
            <div className='auth-poster-image'>
                image
            </div>
        </div>
    )
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, headerAction }) => {
    const { asPath, push } = useRouter()
    const { isAuthenticated } = useAuth()
    const breakpoints = useBreakpoints()

    const isSmallDisplay = !breakpoints.DESKTOP_SMALL

    const { getEventName, logEvent } = useTracking()

    useEffect(() => {
        const eventName = getEventName(TrackingEventType.Visit)
        logEvent({ eventName, denyDuplicates: true })
    }, [asPath])

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            push('/')
        } else {
            push('/auth')
        }
    }, [isAuthenticated, push])

    const AuthHeader = useMemo(() => (
        <Row gutter={[20, 20]} justify='space-between' align='middle'>
            <Col className='logo-wrapper'>
                <Logo onClick={handleLogoClick} />
            </Col>
            {
                isSmallDisplay && headerAction && (
                    <Col>
                        {headerAction}
                    </Col>
                )
            }
        </Row>
    ), [handleLogoClick, headerAction, isSmallDisplay])

    const AuthFooter = useMemo(() => (
        <>
            {
                (SUPPORT_EMAIL || SUPPORT_PHONE) && (
                    <Row justify='center'>
                        {
                            SUPPORT_EMAIL && (
                                <Col span={24}>
                                    <Row justify='center'>
                                        <Col>
                                            <Typography.Link
                                                href={`mailto:${SUPPORT_EMAIL}`}
                                            >
                                                {SUPPORT_EMAIL}
                                            </Typography.Link>
                                        </Col>
                                    </Row>
                                </Col>
                            )
                        }
                        {
                            SUPPORT_PHONE && (
                                <Col span={24}>
                                    <Row justify='center'>
                                        <Col>
                                            <Typography.Link
                                                href={`tel:${SUPPORT_PHONE}`}
                                            >
                                                {SUPPORT_PHONE}
                                            </Typography.Link>
                                        </Col>
                                    </Row>
                                </Col>
                            )
                        }
                    </Row>
                )
            }
        </>
    ), [])

    return (
        <HCaptchaProvider>
            <Global styles={FROM_INPUT_CSS}/>

            <Layout>
                <Row
                    className='auth-layout-wrapper'
                    gutter={[20, 20]}
                >
                    {/* NOTE: 0px so that the width is calculated based on the content */}
                    <Col
                        flex={isSmallDisplay ? 'none' : '0px'}
                        span={isSmallDisplay ? 24 : null}
                    >
                        <AuthPoster AuthHeader={AuthHeader} />
                    </Col>

                    <Col
                        className='auth-content-col'
                        flex={isSmallDisplay ? 'none' : 'auto'}
                        span={isSmallDisplay ? 24 : null}
                    >
                        <Row className='auth-content-row'>
                            <Col flex='2'/>
                            <Col
                                className='auth-content-wrapper'
                                flex='12'
                            >
                                {children}

                                {
                                    !isSmallDisplay && headerAction && (
                                        <Row
                                            className='auth-content-footer'
                                            align='bottom'
                                        >
                                            <Col>
                                                {headerAction}
                                            </Col>
                                        </Row>
                                    )
                                }
                            </Col>
                        </Row>
                    </Col>

                    {
                        isSmallDisplay && (
                            <Row
                                className='auth-content-footer'
                                align='bottom'
                            >
                                <Col>
                                    {AuthFooter}
                                </Col>
                            </Row>
                        )
                    }
                </Row>
            </Layout>
        </HCaptchaProvider>
    )
}

export default AuthLayout

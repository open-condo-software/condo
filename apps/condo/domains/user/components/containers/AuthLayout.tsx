import { Global } from '@emotion/react'
import { Col, Row, Typography } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'

import { FROM_INPUT_CSS } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { HCaptchaProvider } from '@condo/domains/common/components/HCaptcha'
import { Logo } from '@condo/domains/common/components/Logo'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { colors } from '@condo/domains/common/constants/style'

import { AuthLayoutContextProvider } from './AuthLayoutContext'
import { PosterLayout } from './PosterLayout'


interface IAuthLayoutProps {
    headerAction: React.ReactElement
    children: JSX.Element
}
const LOGO_HEADER_STYLES = { width: '100%', justifyContent: 'space-between' }
const HEADER_ACTION_STYLES = { alignSelf:'center', paddingRight: '8px' }
const HEADER_LOGO_STYLE: React.CSSProperties = { cursor: 'pointer' }
const TYPOGRAPHY_CONTACT_STYLE: React.CSSProperties = { color: colors.black }
const SUPPORT_TEXT_STYLE: React.CSSProperties = { fontSize: '12px' }

const {
    publicRuntimeConfig: { HelpRequisites: { support_email: SUPPORT_EMAIL = null, support_phone: SUPPORT_PHONE = null } },
} = getConfig()

const AuthLayout: React.FC<IAuthLayoutProps> = (props) => {
    const intl = useIntl()
    const PrivacyPolicy = intl.formatMessage({ id: 'pages.auth.register.info.PrivacyPolicyContent' })
    const TermsOfService = intl.formatMessage({ id: 'pages.auth.register.info.termsOfService' })

    const { children, ...otherProps } = props

    const { asPath, push } = useRouter()
    const { isAuthenticated } = useAuth()

    const { getEventName, logEvent } = useTracking()

    useEffect(() => {
        const eventName = getEventName(TrackingEventType.Visit)
        logEvent({ eventName, denyDuplicates: true })
    }, [asPath])

    const handleLogoClick = useCallback(() => {
        if (isAuthenticated) {
            push('/')
        } else {
            push('/auth/signin')
        }
    }, [isAuthenticated, push])

    const AuthHeader = useMemo(() => (
        <Row style={LOGO_HEADER_STYLES}>
            <Col style={HEADER_LOGO_STYLE}>
                <Logo onClick={handleLogoClick}/>
            </Col>
            <Col style={HEADER_ACTION_STYLES}>
                {props.headerAction}
            </Col>
        </Row>
    ), [handleLogoClick, props.headerAction])

    const AuthFooter = useMemo(() => (
        <div>
            {SUPPORT_EMAIL && SUPPORT_PHONE &&
                <Typography.Paragraph type='secondary' style={SUPPORT_TEXT_STYLE}>
                    <Typography.Link
                        href={`mailto:${SUPPORT_EMAIL}`}
                        style={TYPOGRAPHY_CONTACT_STYLE}
                    >
                        {SUPPORT_EMAIL}
                    </Typography.Link>
                    ,&nbsp;
                    <Typography.Link
                        href={`tel:${SUPPORT_PHONE}`}
                        style={TYPOGRAPHY_CONTACT_STYLE}
                    >
                        {SUPPORT_PHONE}
                    </Typography.Link>
                </Typography.Paragraph>
            }
        </div>
    ), [])

    return (
        <HCaptchaProvider>
            <Global styles={FROM_INPUT_CSS}/>
            <PosterLayout Header={AuthHeader} Footer={AuthFooter} {...otherProps}>
                <AuthLayoutContextProvider>
                    {children}
                </AuthLayoutContextProvider>
            </PosterLayout>
        </HCaptchaProvider>
    )
}

export default AuthLayout

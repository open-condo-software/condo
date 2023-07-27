import { Global } from '@emotion/react'
import { Col, Row, Typography } from 'antd'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

import { useAuth } from '@open-condo/next/auth'
import { useIntl, FormattedMessage } from '@open-condo/next/intl'

import { FROM_INPUT_CSS } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { Logo } from '@condo/domains/common/components/Logo'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { colors } from '@condo/domains/common/constants/style'

import { AuthLayoutContextProvider } from './AuthLayoutContext'
import { PosterLayout } from './PosterLayout'


const { publicRuntimeConfig: { googleCaptcha } } = getConfig()

export interface AuthPage extends React.FC {
    headerAction?: React.ReactElement
    container: React.FC
}

interface IAuthLayoutProps {
    headerAction: React.ReactElement
    children: JSX.Element
}
interface IGoogleReCaptchaContainer {
    element: string | HTMLElement;
    parameters: {
        badge?: 'inline' | 'bottomleft' | 'bottomright';
        theme?: 'dark' | 'light';
        tabindex?: number;
        callback?: () => void;
        expiredCallback?: () => void;
        errorCallback?: () => void;
    }
}
interface IGoogleReCaptchaScriptProps {
    nonce?: string;
    defer?: boolean;
    async?: boolean;
    appendTo?: 'head' | 'body';
    id?: string;
    onLoadCallbackName?: string;
}
const GOOGLE_RECAPTCHA_CONTAINER: IGoogleReCaptchaContainer = {
    element: 'ReCaptchaContainer',
    parameters: {
        badge: 'inline',
    },
}
const GOOGLE_RECAPTCHA_SCRIPT_PROPS: IGoogleReCaptchaScriptProps = {
    async: true,
    defer: true,
    appendTo: 'body',
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
    const PrivacyPolicy = intl.formatMessage({ id: 'auth.register.info.privacyPolicyContent' })
    const TermsOfService = intl.formatMessage({ id: 'auth.register.info.termsOfService' })

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
            <Typography.Paragraph type='secondary' style={SUPPORT_TEXT_STYLE}>
                <FormattedMessage
                    id='auth.register.info.RecaptchaPrivacyPolicyContent'
                    values={{
                        PrivacyPolicy: (
                            <Typography.Link
                                style={TYPOGRAPHY_CONTACT_STYLE}
                                target='_blank'
                                href='//policies.google.com/privacy'
                                rel='noreferrer'>
                                {PrivacyPolicy}
                            </Typography.Link>
                        ),
                        TermsOfService: (
                            <Typography.Link
                                style={TYPOGRAPHY_CONTACT_STYLE}
                                target='_blank'
                                href='//policies.google.com/terms'
                                rel='noreferrer'>
                                {TermsOfService}
                            </Typography.Link>
                        ),
                    }}
                />
            </Typography.Paragraph>
        </div>
    ), [PrivacyPolicy, TermsOfService])

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={googleCaptcha && googleCaptcha.SITE_KEY}
            language={intl.locale}
            useRecaptchaNet
            container={GOOGLE_RECAPTCHA_CONTAINER}
            scriptProps={GOOGLE_RECAPTCHA_SCRIPT_PROPS}>
            <Global styles={FROM_INPUT_CSS}/>
            <PosterLayout Header={AuthHeader} Footer={AuthFooter} {...otherProps}>
                <AuthLayoutContextProvider>
                    {children}
                </AuthLayoutContextProvider>
            </PosterLayout>
        </GoogleReCaptchaProvider>
    )
}

export default AuthLayout

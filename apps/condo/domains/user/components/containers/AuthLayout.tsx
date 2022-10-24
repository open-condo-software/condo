import React, { useEffect } from 'react'
import { FROM_INPUT_CSS } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { Global } from '@emotion/react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { useIntl } from '@condo/next/intl'
import { useRouter } from 'next/router'
import getConfig from 'next/config'
import { PosterLayout } from './PosterLayout'
import { AuthLayoutContextProvider } from './AuthLayoutContext'
import { useTracking, TrackingEventType } from '@condo/domains/common/components/TrackingContext'

const { publicRuntimeConfig: { googleCaptcha } } = getConfig()

export interface AuthPage extends React.FC {
    headerAction: React.ReactElement
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

const AuthLayout: React.FC<IAuthLayoutProps> = (props) => {
    const intl = useIntl()
    const { children, ...otherProps } = props

    const { asPath } = useRouter()

    const { getEventName, logEvent } = useTracking()

    useEffect(() => {
        const eventName = getEventName(TrackingEventType.Visit)
        logEvent({ eventName, denyDuplicates: true })
    }, [asPath])

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={googleCaptcha && googleCaptcha.SITE_KEY}
            language={intl.locale}
            useRecaptchaNet
            container={GOOGLE_RECAPTCHA_CONTAINER}
            scriptProps={GOOGLE_RECAPTCHA_SCRIPT_PROPS}>
            <Global styles={FROM_INPUT_CSS}/>
            <PosterLayout {...otherProps}>
                <AuthLayoutContextProvider>
                    {children}
                </AuthLayoutContextProvider>
            </PosterLayout>
        </GoogleReCaptchaProvider>
    )
}

export default AuthLayout

import React from 'react'
import { FROM_INPUT_CSS } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { Global } from '@emotion/react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { useIntl } from '@core/next/intl'
import getConfig from 'next/config'
import { PosterLayout } from './PosterLayout'
import { AuthLayoutContextProvider } from './AuthLayoutContext'

const { publicRuntimeConfig: { googleCaptcha } } = getConfig()

export interface AuthPage extends React.FC {
    headerAction: React.ReactElement
    container: React.FC
}

interface IAuthLayoutProps {
    headerAction: React.ReactElement
    children: JSX.Element
}

const AuthLayout: React.FC<IAuthLayoutProps> = (props) => {
    const intl = useIntl()
    const { children, ...otherProps } = props

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={googleCaptcha && googleCaptcha.SITE_KEY}
            language={intl.locale}
            useRecaptchaNet
            scriptProps={{
                async: true,
                defer: true,
                appendTo: 'body',
            }}>
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

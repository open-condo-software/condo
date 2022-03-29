import React  from 'react'
import { formInputFixCss } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { Global } from '@emotion/core'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'
import { useIntl } from '@core/next/intl'
import getConfig from 'next/config'
import { PosterLayout } from './PosterLayout'
import { AuthLayoutContextProvider } from './AuthLayoutContext'

const { publicRuntimeConfig: { googleCaptcha } } = getConfig()

export interface AuthPage extends React.FC {
    container: React.FC
}

interface IAuthLayoutProps {
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
            <Global styles={formInputFixCss}/>
            <PosterLayout {...otherProps}>
                <AuthLayoutContextProvider>
                    {children}
                </AuthLayoutContextProvider>
            </PosterLayout>
        </GoogleReCaptchaProvider>
    )
}

export default AuthLayout

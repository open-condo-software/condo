import { PageHeader as AntPageHeader } from 'antd'
import React, { createContext, useCallback } from 'react'
import Router from 'next/router'
import { FormattedMessage } from 'react-intl'
import { ConfigProvider, Layout } from 'antd'
import { 
    SIGNIN_MUTATION,
    SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION,
} from '@condo/domains/user/gql'
import { useMutation } from '@core/next/apollo'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useAuth } from '@core/next/auth'
const { Footer, Content } = Layout
import { Logo } from '@condo/domains/common/components/Logo'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { colors } from '@condo/domains/common/constants/style'
import { formInputFixCss } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import { Global } from '@emotion/core'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { useIntl } from '@core/next/intl'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
const ANT_DEFAULT_LOCALE = enUS
const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}
import { useAntdMediaQuery } from '@condo/domains/common/utils/mediaQuery.utils'
import getConfig from 'next/config'
const { publicRuntimeConfig: { googleCaptcha } } = getConfig()

export interface AuthPage extends React.FC {
    headerAction: React.ReactElement
    container: React.FC
}

const FOOTER_LINK_STYLE = { color: colors.sberPrimary[7] }
const AUTH_PAGES_STYLE = { width: '100%', maxWidth: '500px', paddingLeft: '20px', paddingRight: '20px' } 
const HEADER_STYLE = { background: colors.white, padding: '20px', margin: '0px', width: '100%' }
const FOOTER_STYLE = { color: colors.lightGrey[7], backgroundColor: colors.white, fontSize: '12px', lineHeight: '20px',  padding: '20px' }

const PageContent: React.FC = ({ children }) => {
    return (
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={AUTH_PAGES_STYLE}>
                {children}
            </div>
        </Content>
    )
}

const PageFooter: React.FC = () => {
    return (
        <Footer style={FOOTER_STYLE}>
            <FormattedMessage
                id='pages.auth.FooterText'
                values={{
                    email: <a style={FOOTER_LINK_STYLE} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>,
                    phone: <a style={FOOTER_LINK_STYLE} href={`tel:${SUPPORT_PHONE}`}>{SUPPORT_PHONE}</a>,
                }}
            />
        </Footer>
    )
}

interface IAuthLayoutProps {
    headerAction: React.ReactElement
}
interface IAuthLayoutContext {
    isMobile: boolean
    signInByEmail: ({ email, password }) => Promise<unknown>,
    signInByPhone: ({ phone, password }) => Promise<unknown>,
    handleReCaptchaVerify: (action: string) => Promise<string>,
}


export const AuthLayoutContext = createContext<IAuthLayoutContext>({
    isMobile: false,
    signInByEmail: ({ email, password }) => null,
    signInByPhone: ({ phone, password }) => null,
    handleReCaptchaVerify: (action: string) => null,
})

const AuthLayout: React.FC<IAuthLayoutProps> = ({ children, headerAction }) => {
    const intl = useIntl()
    const colSize = useAntdMediaQuery()
    const { refetch } = useAuth()
    const { executeRecaptcha } = useGoogleReCaptcha()
    const handleReCaptchaVerify = useCallback(async (action) => {
        const userToken = await executeRecaptcha(action)
        return userToken
    }, [executeRecaptcha])

    const isMobile = (colSize === 'xs')
    const [signinByPhoneMutation] = useMutation(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION)
    const signInByPhone = ({ phone, password }) => {
        return runMutation({
            mutation: signinByPhoneMutation,
            variables: { phone, password },
            onCompleted: () => {
                refetch()
            },
            intl,
        }).catch(error => {
            console.error(error)
        })
    }
    // TODO(zuch): remove after making email optional
    const [signinByEmailMutation] = useMutation(SIGNIN_MUTATION)
    const signInByEmail = ({ email, password }) => {
        return runMutation({
            mutation: signinByEmailMutation,
            variables: { email, password },
            onCompleted: () => {
                refetch()
            },
            intl,
        }).catch(error => {
            console.error(error)
        })
    }    
    return (
        <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE}>
            <GoogleReCaptchaProvider
                reCaptchaKey={googleCaptcha}
                language={intl.locale}
                useRecaptchaNet
                scriptProps={{
                    async: true, 
                    defer: true, 
                    appendTo: 'body',
                }}>
                <AuthLayoutContext.Provider value={{ 
                    isMobile,
                    signInByEmail,
                    signInByPhone,
                    handleReCaptchaVerify,
                }}>
                    <Global styles={formInputFixCss}></Global>
                    <Layout style={{ background: colors.white, height: '100vh' }}>
                        <AntPageHeader
                            style={{ ...HEADER_STYLE, position: 'fixed' }}
                            title={<Logo onClick={() => Router.push('/')} />}
                            extra={headerAction}
                        >
                        </AntPageHeader>
                        <PageContent>
                            {children}
                        </PageContent>
                        <PageFooter />
                    </Layout>
                </AuthLayoutContext.Provider>
            </GoogleReCaptchaProvider>
        </ConfigProvider>
    )
}

export default AuthLayout

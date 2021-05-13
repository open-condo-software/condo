import { PageHeader as AntPageHeader } from 'antd'
import React, { createContext } from 'react'
import Router from 'next/router'
import { FormattedMessage } from 'react-intl'
import { ConfigProvider, Layout } from 'antd'

const { Footer, Content } = Layout
import { Logo } from '@condo/domains/common/components/Logo'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { colors } from '@condo/domains/common/constants/style'

import { useIntl } from '@core/next/intl'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'
const ANT_DEFAULT_LOCALE = enUS
const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}
import { useAntdMediaQuery } from '@condo/domains/common/utils/mediaQuery.utils'

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

export const AuthLayoutContext = createContext({
    isMobile: false,
})

const AuthLayout: React.FC<IAuthLayoutProps> = ({ children, headerAction }) => {
    const intl = useIntl()
    const colSize = useAntdMediaQuery()
    const isMobile = (colSize === 'xs')
    return (
        <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE}>
            <AuthLayoutContext.Provider value={{ isMobile }}>
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
                    <div id={'recaptcha-container'}/>
                </Layout>
            </AuthLayoutContext.Provider>
        </ConfigProvider>
    )
}

export default AuthLayout

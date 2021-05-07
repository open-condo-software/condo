import { PageHeader as AntPageHeader } from 'antd'
import React from 'react'
import Router from 'next/router'
import { FormattedMessage } from 'react-intl'
import { Layout } from 'antd'
const { Footer, Content } = Layout
import { Logo } from '@condo/domains/common/components/Logo'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'
import { colors } from '@condo/domains/common/constants/style'

const FOOTER_STYLE = { color: colors.lightGrey[7], backgroundColor: colors.white, fontSize: '12px', lineHeight: '20px', marginLeft: '36px', padding: '0px' }
const FOOTER_LINK_STYLE = { color: colors.sberPrimary[7] }
const HEADER_STYLE = { background: colors.white, marginTop: '20px', marginLeft: '12px', marginRight: '12px' }
const AUTH_PAGES_STYLE = { maxWidth: '450px' } 


const PageContent: React.FC = ({ children }) => {
    // TODO(zuch): change parent height from calc value
    return (
        <Content style={{ marginLeft: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}>
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
            ></FormattedMessage>
        </Footer>
    )
}

interface IAuthLayoutProps {
    headerAction: React.ReactElement
}

const AuthLayout: React.FC<IAuthLayoutProps> = ({ children, headerAction }) => {
    return (
        <Layout
            style={{ background: colors.white }}
        >
            <AntPageHeader
                style={HEADER_STYLE}
                title={<Logo onClick={() => Router.push('/')} />}
                extra={headerAction}
            >
            </AntPageHeader>
            <PageContent>
                {children}
            </PageContent>
            <PageFooter />
        </Layout>
    )
}

export default AuthLayout

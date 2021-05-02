import { PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import React from 'react'
import Router from 'next/router'
import { FormattedMessage } from 'react-intl'
import { Layout } from 'antd'
const { Footer, Content } = Layout
import { Logo } from '@condo/domains/common/components/Logo'
import { SUPPORT_EMAIL, SUPPORT_PHONE } from '@condo/domains/common/constants/requisites'

interface IPageHeaderProps extends PageHeaderProps {
    title?: React.ReactChild
    headerAction?: React.ReactChild
}

const PageHeader: React.FC<IPageHeaderProps> = ({ children, headerAction }) => {
    return (
        <AntPageHeader
            style={{ margin: '40px', padding: '0px', background: 'white' }}
            title={<Logo onClick={() => Router.push('/')} />}
            extra={[headerAction]}
        >
            {children}
        </AntPageHeader>
    )
}

const PageContent: React.FC = ({ children }) => {
    return (
        <Content>
            {children}
        </Content>
    )
}


const PageFooter: React.FC = () => {
    return (
        <Footer style={{ color: 'gray', backgroundColor: 'white', marginTop: '60px' }}>
            <FormattedMessage
                id='pages.auth.FooterText'
                values={{
                    email: <a style={{ color: '#44c77f' }} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>,
                    phone: <a style={{ color: '#44c77f' }} href={`tel:${SUPPORT_PHONE}`}>{SUPPORT_PHONE}</a>,
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
            style={{ background: 'white' }}
            key={Math.random().toString()}
        >
            <PageHeader headerAction={headerAction} />
            <PageContent>
                {children}
            </PageContent>
            <PageFooter />
        </Layout>
    )
}

export default AuthLayout
/*
import { jsx } from '@emotion/core'


import { PageContent } from './BaseLayout'
import { ConfigProvider, PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import { createContext, CSSProperties, FunctionComponent, useContext, useState } from 'react'





import { layoutCss, pageContentCss, pageHeaderCss, pageWrapperCss } from './components/styles'

interface IPageWrapperProps {
    className?: string
    style?: CSSProperties
}

const PageWrapper: FunctionComponent<IPageWrapperProps> =  ({ children, className, style }) => {
    return (
        <Content className={classnames('page-wrapper', className)} css={pageWrapperCss} as="main" style={style}>
            {children}
        </Content>
    )
}

interface IAuthLayoutProps {
    backActionButton?: React.FunctionComponent
}

const AuthLayout: React.FunctionComponent<IAuthLayoutProps> = ({ children, backActionButton }) => {
    return (
        <Layout css={layoutCss}>
            <AntPageHeader css={pageHeaderCss}>МУМУ</AntPageHeader>
            <Content css={pageContentCss}>
                <PageWrapper>
                    {children}
                </PageWrapper>
            </Content>
            <Footer>МУМУ</Footer>
        </Layout>
    )
}

export default AuthLayout

/*

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck



import { DashboardOutlined } from '@ant-design/icons'
import { SideMenu } from './components/SideMenu'

import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'


import 'antd/dist/antd.less'
import { TopMenuItems } from './components/TopMenuItems'
import { useIntl } from '@core/next/intl'
import { useAntdMediaQuery } from '../../../utils/mediaQuery.utils'


const LayoutContext = createContext({})
const useLayoutContext = () => useContext(LayoutContext)

const { Header, Content } = Layout

const ANT_DEFAULT_LOCALE = enUS

const ANT_LOCALES = {
    ru: ruRU,
    en: enUS,
}

const DEFAULT_MENU = [
    {
        path: '/',
        icon: <DashboardOutlined/>,
        locale: 'menu.Home',
    },
]

function BaseLayout (props) {
    const {
        style,
        children,
        className,
        disableMobile,
        headerAction,
        onLogoClick = () => Router.push('/'),
        menuDataRender = () => DEFAULT_MENU,
    } = props

    const intl = useIntl()
    const colSize = useAntdMediaQuery()
    // TODO(Dimitreee): add UA base isMobile detection
    const isMobile = (colSize === 'xs') && !disableMobile
    const menuData = menuDataRender()
    const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(!isMobile)

    const menuDataClassNames = classnames(
        'layout',
        { 'hided-side-menu': !menuData || menuData.length === 0 },
        className
    )

    const toggleSideMenuCollapsed = () => setIsSideMenuCollapsed(!isSideMenuCollapsed)

    return (
        <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE} componentSize={'large'}>
            <LayoutContext.Provider value={{ isMobile }}>
                <Layout className={menuDataClassNames} style={style} css={layoutCss} as="section">
                    <SideMenu {...{
                        onLogoClick,
                        menuData,
                        isMobile,
                        isSideMenuCollapsed,
                        toggleSideMenuCollapsed,
                    }}/>
                    <Layout css={subLayoutCss}>
                        <Header css={topMenuCss}>
                            <TopMenuItems
                                headerAction={headerAction}
                                isMobile={isMobile}
                                isSideMenuCollapsed={isSideMenuCollapsed}
                                toggleSideMenuCollapsed={toggleSideMenuCollapsed}
                            />
                        </Header>
                        {children}
                    </Layout>
                </Layout>
            </LayoutContext.Provider>
        </ConfigProvider>
    )
}



interface IPageHeaderProps extends PageHeaderProps {
    title?: React.ReactChild
    subTitle?: string
    className?: string
    style?: CSSProperties
}

const PageHeader: FunctionComponent<IPageHeaderProps> = ({ children, className, style, title, subTitle, ...pageHeaderProps }) => {
    return (
        <AntPageHeader
            className={classnames('page-header', className)} css={pageHeaderCss} style={style}
            title={title} subTitle={subTitle}
            {...pageHeaderProps}
        >
            {children}
        </AntPageHeader>
    )
}

interface IPageContentProps {
    className?: string
    style?: CSSProperties
}

const PageContent: FunctionComponent<IPageContentProps> = ({ children, className, style }) => {
    return (
        <div className={classnames('page-content', className)} css={pageContentCss} style={style}>
            {children}
        </div>
    )
}

export default BaseLayout
export {
    useLayoutContext,
    PageWrapper,
    PageHeader,
    PageContent,
}


*/
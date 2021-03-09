// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { createContext, CSSProperties, FunctionComponent, useContext, useState } from 'react'
import { ConfigProvider, Layout, PageHeader as AntPageHeader, PageHeaderProps } from 'antd'
import { DashboardOutlined } from '@ant-design/icons'
import { SideMenu } from './components/SideMenu'
import Router from 'next/router'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'

import 'antd/dist/antd.less'
import TopMenuItems from './components/TopMenuItems'
import { useIntl } from '@core/next/intl'
import { useAntdMediaQuery } from '../../utils/mediaQuery.utils'

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
    {
        path: '/auth/signin',
        locale: 'menu.Auth',
        hideInMenu: true,
        children: [
            {
                path: '/auth/signin',
                locale: 'menu.SignIn',
            },
            {
                path: '/auth/register',
                locale: 'menu.SignUp',
            },
            {
                path: '/auth/forgot',
                locale: 'menu.ResetPassword',
            },
            {
                path: '/auth/change-password',
                locale: 'menu.ChangePassword',
            },
        ],
    },
]

const layoutCss = css`
  height: 100%;
  display: flex;
  align-items: stretch;
`

const subLayoutCss = css`
  width: 100%;
  display: flex;
  align-items: stretch;
`

const topMenuCss = css`
  z-index: 9;
  background: #fff;
  padding: 0;
  box-shadow: 2px 0 6px rgba(0,21,41,.35);
  min-width: 100%;
  clear: both;
`

const pageWrapperCss = css`
  margin: 0;
  padding: 0;
`

const pageHeaderCss = css`
  margin: 0 24px 24px;
  padding: 24px;
  background: #fff;

  @media (max-width: 768px) {
    margin: 0 0 12px;
  }
  @media (max-width: 480px) {
    margin: 0 0 12px;
  }
`

const pageContentCss = css`
  margin: 24px;
  padding: 24px;
  background: #fff;
  border-radius: 2px;

  @media (max-width: 768px) {
    margin: 12px 0;
    border-radius: 0;
  }
  @media (max-width: 480px) {
    margin: 12px 0;
    border-radius: 0;
  }
`

function BaseLayout (props) {
    const {
        children,
        style,
        disableMobile,
        onLogoClick = () => Router.push('/'),
        menuDataRender = () => DEFAULT_MENU,
    } = props

    let { className } = props

    const intl = useIntl()
    const colSize = useAntdMediaQuery()
    // TODO(Dimitreee): add UA base isMobile detection
    const isMobile = (colSize === 'xs') && !disableMobile
    const menuData = menuDataRender()
    const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(!isMobile)

    if (!menuData || menuData.length === 0) {
        className = className + ' hided-side-menu'
    }

    const toggleSideMenuCollapsed = () => setIsSideMenuCollapsed(!isSideMenuCollapsed)

    const sideMenuProps = {
        onLogoClick,
        menuData,
        isMobile,
        isSideMenuCollapsed,
        toggleSideMenuCollapsed,
    }

    // TODO(pahaz): should we move locale logic from here to other place? (Like AntLocale ?)
    return (
        <ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE}>
            <LayoutContext.Provider value={{ isMobile }}>
                <Layout className={`layout ${className || ''}`} style={style} css={layoutCss} as="section">
                    <SideMenu {...sideMenuProps}/>
                    <Layout css={subLayoutCss}>
                        <Header className="top-menu" css={topMenuCss}>
                            <TopMenuItems
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

interface IPageWrapperProps {
    className?: string
    style?: CSSProperties
}

const PageWrapper:FunctionComponent<IPageWrapperProps> =  ({ children, className, style }) => {
    return (
        <Content className={`page-wrapper ${className || ''}`} css={pageWrapperCss} as="main" style={style}>
            {children}
        </Content>
    )
}

interface IPageHeaderProps extends PageHeaderProps {
    title?: string
    subTitle?: string
    className?: string
    style?: CSSProperties
}

const PageHeader:FunctionComponent<IPageHeaderProps> = ({ children, className, style, title, subTitle, ...pageHeaderProps }) => {
    return (
        <AntPageHeader
            className={`page-header ${className || ''}`} css={pageHeaderCss} style={style}
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

const PageContent:FunctionComponent<IPageContentProps> = ({ children, className, style }) => {
    return (
        <div className={`page-content ${className || ''}`} css={pageContentCss} style={style}>
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

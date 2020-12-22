/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { createContext, useContext, useState } from 'react'
import { ConfigProvider, Drawer, Layout, Menu, PageHeader as AntPageHeader } from 'antd'
import { DashboardOutlined } from '@ant-design/icons'
import Router from 'next/router'
import enUS from 'antd/lib/locale/en_US'
import ruRU from 'antd/lib/locale/ru_RU'

import './antd-custom.less'
import TopMenuItems from './components/TopMenuItems'
import { useIntl } from '@core/next/intl'
import { useAntdMediaQuery } from '../../utils/mediaQuery.utils'

const LayoutContext = createContext({})
const useLayoutContext = () => useContext(LayoutContext)
const { Header, Sider, Content } = Layout
const { SubMenu } = Menu

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

const sideMenuSiderCss = css`
    z-index: 10;
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
    min-height: 100%;
`

const sideMenuLogoCss = css`
    height: 64px;
    margin: 0 24px;
    cursor: pointer;
    
    transition: all 0.2s;
    filter: brightness(10);
    
    .ant-layout-sider-collapsed & {
        height: 48px;
        margin: 8px 16px;
    }
`

const topMenuCss = css`
    z-index: 9;
    background: #fff;
    padding: 0;
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
    min-width: 100%;
    clear: both;
`

const topMenuLogoCss = css`
    float: left;
    height: 64px;
    margin: 0 24px;
    cursor: pointer;

    @media (max-width: 768px) {
        margin: 0 12px;
        border-radius: 0;
    }
    @media (max-width: 480px) {
        margin: 0 12px;
        border-radius: 0;
    }
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

function renderMenuData (menuData, menuItemRender, localeRender, onClickMenuItem) {
    return menuData.map((item) => {
        if (item.hideInMenu) return null
        const text = item.locale ? localeRender(item.locale) : item.name
        return (
            (item.children && !item.hideChildrenInMenu) ?
                <SubMenu key={item.path} icon={item.icon} title={menuItemRender(item, text)}
                         onTitleClick={() => onClickMenuItem(item)}>
                    {renderMenuData(item.children, menuItemRender, localeRender, onClickMenuItem)}
                </SubMenu>
                :
                <Menu.Item key={item.path} icon={item.icon} onClick={() => onClickMenuItem(item)}>
                    {menuItemRender(item, text)}
                </Menu.Item>
        )
    })
}

function SideMenu ({ logoLocation, onLogoClick, menuData, menuItemRender, localeRender, onClickMenuItem, sideMenuWidth, isMobile, isSideMenuCollapsed, toggleSideMenuCollapsed }) {
    const logo = <img css={sideMenuLogoCss} src="/logo.svg" onClick={onLogoClick}/>
    const menu = <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
        {renderMenuData(menuData, menuItemRender, localeRender, onClickMenuItem)}
    </Menu>
    return isMobile ? (
        <Drawer
            closable={false}
            visible={!isSideMenuCollapsed}
            placement="left"
            style={{
                padding: 0,
                height: '100vh',
            }}
            width={sideMenuWidth}
            bodyStyle={{ height: '100vh', padding: 0 }}
            className="side-menu"
            onClose={toggleSideMenuCollapsed}
        >
            <Sider css={sideMenuSiderCss} as="aside" width={sideMenuWidth}
                   collapsible collapsed={false} onCollapse={toggleSideMenuCollapsed}
            >
                {logo}{menu}
            </Sider>
        </Drawer>
    ) : (
        <Sider className="side-menu" css={sideMenuSiderCss} as="aside" width={sideMenuWidth}
               collapsible collapsed={isSideMenuCollapsed} onCollapse={toggleSideMenuCollapsed}
        >
            {(logoLocation === 'sideMenu') ? logo : null}{menu}
        </Sider>
    )
}

function BaseLayout ({ children, logoLocation = 'sideMenu', className, style, ...props }) {
    // .layout { .top-menu .side-menu .page-wrapper { .page-header .page-content } }
    // try to be compatible with https://github.com/ant-design/ant-design-pro-layout/blob/master/README.md#api
    const intl = useIntl()
    const colSize = useAntdMediaQuery()
    const isMobile = (colSize === 'xs') && !props.disableMobile
    console.log(isMobile, colSize)

    const localeRender = (locale) => intl.formatMessage({ id: locale })
    const menuDataRender = props.menuDataRender || (() => DEFAULT_MENU)
    const menuItemRender = props.menuItemRender || ((props, item) => item)
    const onLogoClick = props.onLogoClick || (() => Router.push('/'))
    const onClickMenuItem = props.onClickMenuItem || ((item) => (item.children) ? null : Router.push(item.path))
    const menuData = menuDataRender()
    const isMenuEmpty = !menuData || menuData.length === 0

    const sideMenuWidth = 200

    const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState((isMobile) ? false : true)

    function toggleSideMenuCollapsed () {
        setIsSideMenuCollapsed(!isSideMenuCollapsed)
    }

    // FIXES
    if (isMenuEmpty) {
        logoLocation = 'topMenu'
        className = className + ' hided-side-menu'
    }

    // TODO(pahaz): should we move locale logic from here to other place? (Like AntLocale ?)
    return (<ConfigProvider locale={ANT_LOCALES[intl.locale] || ANT_DEFAULT_LOCALE}>
        <LayoutContext.Provider value={{ isMobile }}>
            <Layout className={`layout ${className || ''}`} style={style} css={layoutCss} as="section">
                <SideMenu {...{
                    logoLocation,
                    onLogoClick,
                    menuData,
                    menuItemRender,
                    localeRender,
                    onClickMenuItem,
                    sideMenuWidth,
                    isMobile,
                    isSideMenuCollapsed,
                    toggleSideMenuCollapsed,
                }} />
                <Layout css={subLayoutCss}>
                    <Header className="top-menu" css={topMenuCss}>
                        {logoLocation === 'topMenu' ? <img css={topMenuLogoCss} src="/logo.svg"
                                                           onClick={onLogoClick}/> : null}
                        <TopMenuItems isMobile={isMobile} isSideMenuCollapsed={isSideMenuCollapsed}
                                      toggleSideMenuCollapsed={toggleSideMenuCollapsed}/>
                    </Header>
                    {children}
                </Layout>
            </Layout>
        </LayoutContext.Provider>
    </ConfigProvider>)
}

function PageWrapper ({ children, className, style }) {
    return <Content className={`page-wrapper ${className || ''}`} css={pageWrapperCss} as="main" style={style}>
        {children}
    </Content>
}

function PageHeader ({ children, className, style, title, subTitle }) {
    return <AntPageHeader
        className={`page-header ${className || ''}`} css={pageHeaderCss} style={style}
        title={title} subTitle={subTitle}
    >
        {children}
    </AntPageHeader>
}

function PageContent ({ children, className, style }) {
    return <div className={`page-content ${className || ''}`} css={pageContentCss} style={style}>
        {children}
    </div>
}

export default BaseLayout
export {
    useLayoutContext,
    PageWrapper,
    PageHeader,
    PageContent,
}

/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { createContext, useContext, useState } from 'react'
import { Layout, Menu, PageHeader, Drawer } from 'antd'
import {
    DesktopOutlined,
    FileOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
    DashboardOutlined,
    FormOutlined,
    TableOutlined,
    ProfileOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    HighlightOutlined,
} from '@ant-design/icons'
import Router from 'next/router'
import { useRouter } from 'next/router'

import './antd-custom.less'
import TopMenuItems from './components/TopMenuItems'
import { useIntl } from '@core/next/intl'
import { useAntdMediaQuery } from '../../utils/mediaQuery.utils'

const LayoutContext = createContext({})
const useLayoutContext = () => useContext(LayoutContext)
const { Header, Sider, Content } = Layout
const { SubMenu } = Menu

const DEFAULT_MENU = [
    {
        path: '/',
        icon: <DashboardOutlined/>,
        locale: 'menu.Home',
    },
    {
        path: '/auth',
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

const layoutSideMenuCss = css`
    z-index: 10;
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
    min-height: 100%;
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
`

const pageHeaderCss = css`
    padding: 12px 24px 12px;
    background-color: #fff;
`

const pageContentCss = css`
    margin: 24px;
    padding: 24px;
    min-height: 280px;
    background: white;
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

const topMenuLogoCss = css`
    float: left;
    height: 64px;
    margin: 0 24px;
    cursor: pointer;
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

function getBreadcrumbFromMenuData (menuData, pathname, menuItemRender, localeRender, onClickMenuItem) {
    let result = null
    const find = menuData => {
        for (const item of menuData) {
            if (pathname.startsWith(item.path)) {
                result = item.breadcrumb ? item.breadcrumb : null
                if (item.children) find(item.children)
                return
            }
        }
    }
    find(menuData)
    return result
}

function SideMenu ({ logoLocation, onLogoClick, menuData, menuItemRender, localeRender, onClickMenuItem, sideMenuWidth, isMobile, isSideMenuCollapsed, toggleSideMenuCollapsed }) {
    const logo = logoLocation === 'sideMenu' ? <img css={sideMenuLogoCss} src="/logo.svg" onClick={onLogoClick}/> : null
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
            <Sider css={layoutSideMenuCss} as="aside" width={sideMenuWidth}
                   collapsible collapsed={false} onCollapse={toggleSideMenuCollapsed}
            >
                {logo}{menu}
            </Sider>
        </Drawer>
    ) : (
        <Sider className="side-menu" css={layoutSideMenuCss} as="aside" width={sideMenuWidth}
               collapsible collapsed={isSideMenuCollapsed} onCollapse={toggleSideMenuCollapsed}
        >
            {logo}{menu}
        </Sider>
    )
}

function BaseLayout (props) {
    // .layout { .top-menu .side-menu .page-wrapper { .page-header .page-content } }
    // try to be compatible with https://github.com/ant-design/ant-design-pro-layout/blob/master/README.md#api
    const { pathname } = useRouter()
    const intl = useIntl()
    const colSize = useAntdMediaQuery()
    const isMobile = (colSize === 'xs') && !props.disableMobile
    console.log(isMobile, colSize)

    const logoLocation = (isMobile) ? 'sideMenu' : props.logoLocation || 'sideMenu'
    const localeRender = (locale) => intl.formatMessage({ id: locale })
    const menuDataRender = props.menuDataRender || (() => DEFAULT_MENU)
    const menuItemRender = props.menuItemRender || ((props, item) => item)
    const onLogoClick = props.onLogoClick || (() => Router.push('/'))
    const onClickMenuItem = props.onClickMenuItem || ((item) => (item.children) ? null : Router.push(item.path))
    const menuData = menuDataRender()

    const title = props.title || null
    const subTitle = props.subTitle || null
    const pageHeaderContent = props.pageHeaderContent || null
    const pageHeaderExtra = props.pageHeaderExtra || null
    const breadcrumbData = getBreadcrumbFromMenuData(menuData, pathname, menuItemRender, localeRender, onClickMenuItem)
    const hasPageHeader = Boolean(title || subTitle || breadcrumbData)

    const sideMenuWidth = 200

    const [isSideMenuCollapsed, setIsSideMenuCollapsed] = useState(isMobile)
    const toggleSideMenuCollapsed = () => {
        setIsSideMenuCollapsed(!isSideMenuCollapsed)
    }

    return (<LayoutContext.Provider value={{ isMobile }}>
        <Layout className={`layout ${props.className ? props.className : ''}`}
                css={layoutCss} as="section">
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
                <Content className="page-wrapper" css={pageWrapperCss} as="main">
                    <PageHeader className="page-header" css={pageHeaderCss}
                                style={{ display: (hasPageHeader) ? 'block' : 'none' }}
                                title={title} subTitle={subTitle}
                                extra={pageHeaderExtra}
                                breadcrumb={{ routes: breadcrumbData }}>
                        {pageHeaderContent}
                    </PageHeader>
                    <div className="page-content" css={pageContentCss}>
                        {props.children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    </LayoutContext.Provider>)
}

export default BaseLayout
export {
    useLayoutContext,
}

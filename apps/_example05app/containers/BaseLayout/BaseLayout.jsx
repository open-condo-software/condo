/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { useState } from 'react'
import { Breadcrumb, Layout, Menu } from 'antd'
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

import './antd-custom.less'
import MenuHeader from './components/MenuHeader'
import { useIntl } from '@core/next/intl'

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
`

const sideMenuCss = css`
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
`

const topMenuWrapperCss = css`
`

const topMenuCss = css`
    background: #fff;
    padding: 0;
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
    min-width: 100%;
`

const mainContentWrapperCss = css`
`

const mainContentBreadcrumbCss = css`
    margin: 16px;
    padding: 0 0 0 24px;
`

const mainContentCss = css`
    margin: 16px;
    padding: 24px;
    min-height: 280px;
    background: white;
    border-radius: 2px;
`

const logoCss = css`
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

const logoTopCss = css`
    height: 64px;
    margin: 0 16px;
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

function BaseLayout (props) {
    // try to be compatible with https://github.com/ant-design/ant-design-pro-layout/blob/master/README.md#api
    const [collapsed, setCollapsed] = useState(false)
    const intl = useIntl()

    const logoLocation = props.logoLocation || 'sideMenu'
    const localeRender = (locale) => intl.formatMessage({ id: locale })
    const menuDataRender = props.menuDataRender || (() => DEFAULT_MENU)
    const menuItemRender = props.menuItemRender || ((props, item) => item)
    const onLogoClick = props.onLogoClick || (() => Router.push('/'))
    const onClickMenuItem = props.onClickMenuItem || ((item) => (item.children) ? null : Router.push(item.path))

    const menuData = menuDataRender()

    const toggleCollapsed = () => {
        setCollapsed(!collapsed)
    }

    return (
        <Layout css={layoutCss} as="section">
            <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapsed} css={sideMenuCss} as="aside"
                   style={props.sideMenuStyle}>
                {logoLocation === 'sideMenu' ? <img css={logoCss} src="/logo.svg" onClick={onLogoClick}/> : null}
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                    {renderMenuData(menuData, menuItemRender, localeRender, onClickMenuItem)}
                </Menu>
            </Sider>
            <Layout css={topMenuWrapperCss} style={props.topMenuWrapperStyle}>
                <Header css={topMenuCss} style={props.topMenuStyle}>
                    {logoLocation === 'topMenu' ? <img css={logoTopCss} src="/logo.svg" onClick={onLogoClick}/> : null}
                    <MenuHeader/>
                </Header>
                <Content css={mainContentWrapperCss} as="div" style={props.mainContentWrapperStyle}>
                    <Breadcrumb css={mainContentBreadcrumbCss} style={props.mainContentBreadcrumbStyle}>
                        <Breadcrumb.Item>User</Breadcrumb.Item>
                        <Breadcrumb.Item>Bill</Breadcrumb.Item>
                    </Breadcrumb>
                    <div css={mainContentCss} as="main" style={props.mainContentStyle}>
                        {props.children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default BaseLayout

/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { useState } from 'react'
import { Layout, Menu, PageHeader } from 'antd'
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
import TopMenu from './components/TopMenu'
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

const layoutSideMenuCss = css`
    z-index: 10;
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
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

function getBreadcrumbFromMenuData(menuData, pathname, menuItemRender, localeRender, onClickMenuItem) {
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

function BaseLayout (props) {
    // .layout { .top-menu .side-menu .page-wrapper { .page-header .page-content } }
    // try to be compatible with https://github.com/ant-design/ant-design-pro-layout/blob/master/README.md#api
    const [collapsed, setCollapsed] = useState(false)
    const { pathname } = useRouter()
    const intl = useIntl()

    const logoLocation = props.logoLocation || 'sideMenu'
    const localeRender = (locale) => intl.formatMessage({ id: locale })
    const menuDataRender = props.menuDataRender || (() => DEFAULT_MENU)
    const menuItemRender = props.menuItemRender || ((props, item) => item)
    const onLogoClick = props.onLogoClick || (() => Router.push('/'))
    const onClickMenuItem = props.onClickMenuItem || ((item) => (item.children) ? null : Router.push(item.path))
    const menuData = menuDataRender()

    const title = props.title || null
    const subTitle = props.subTitle || null
    const breadcrumbData = getBreadcrumbFromMenuData(menuData, pathname, menuItemRender, localeRender, onClickMenuItem)
    const hasPageHeader = Boolean(title || subTitle || breadcrumbData)

    const toggleCollapsed = () => {
        setCollapsed(!collapsed)
    }

    return (
        <Layout className={`layout ${props.className ? props.className : ''}`} css={layoutCss} as="section">
            <Sider className="side-menu" css={layoutSideMenuCss} as="aside"
                   collapsible collapsed={collapsed} onCollapse={toggleCollapsed}
            >
                {logoLocation === 'sideMenu' ? <img css={sideMenuLogoCss} src="/logo.svg" onClick={onLogoClick}/> : null}
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                    {renderMenuData(menuData, menuItemRender, localeRender, onClickMenuItem)}
                </Menu>
            </Sider>
            <Layout>
                <Header className="top-menu" css={topMenuCss}>
                    {logoLocation === 'topMenu' ? <img css={topMenuLogoCss} src="/logo.svg" onClick={onLogoClick}/> : null}
                    <TopMenu/>
                </Header>
                <Content className="page-wrapper" css={pageWrapperCss} as="main">
                    <PageHeader className="page-header" css={pageHeaderCss}
                                style={{display: (hasPageHeader) ? 'block' : 'none'}}
                                title={title} subTitle={subTitle}
                                breadcrumb={{routes: breadcrumbData}}/>
                    <div className="page-content" css={pageContentCss}>
                        {props.children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default BaseLayout

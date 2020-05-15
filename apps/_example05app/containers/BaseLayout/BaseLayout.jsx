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
import Link from 'next/link'

import './antd-custom.less'
import MenuHeader from './components/MenuHeader'
import { useIntl } from '@core/next/intl'

const { Header, Sider, Content } = Layout
const { SubMenu } = Menu

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

function renderMenuData (menuData, menuItemRender, localeRender) {
    return menuData.map((item) => {
        if (item.hideInMenu) return null
        const text = item.locale ? localeRender(item.locale) : item.name
        return (
            (item.children && !item.hideChildrenInMenu) ?
                <SubMenu key={item.path} icon={item.icon} title={menuItemRender(item, text)}>
                    {renderMenuData(item.children, menuItemRender, localeRender)}
                </SubMenu>
                :
                <Menu.Item key={item.path} icon={item.icon}>{menuItemRender(item, text)}</Menu.Item>
        )
    })
}

function BaseLayout (props) {
    // try to be compatible with https://github.com/ant-design/ant-design-pro-layout/blob/master/README.md#api
    const [collapsed, setCollapsed] = useState(false)
    const intl = useIntl()

    const logo = props.logoLocation || 'sideMenu'
    const localeRender = (locale) => intl.formatMessage({ id: locale })
    const menuDataRender = props.menuDataRender || (() => [
        {
            'path': '/dashboard',
            'name': 'Dashboard',
            icon: <DashboardOutlined/>,

            'children': [
                {
                    'path': '/dashboard/analysis',
                    'name': 'Analysis',

                    'locale': 'menu.dashboard.analysis',

                    'exact': true,

                }, {
                    'path': '/dashboard/monitor',
                    'name': 'Monitor',

                    'locale': 'menu.dashboard.monitor',

                    'exact': true,

                }, {
                    'path': '/dashboard/workplace',
                    'name': 'Workplace',

                    'locale': 'menu.dashboard.workplace',

                    'exact': true,

                }],
            'locale': 'menu.dashboard',

        }, {
            'path': '/form',
            'name': 'Form',
            icon: <FormOutlined/>,

            'children': [
                {
                    'path': '/form/basic-form',

                    'name': 'Basic Form',

                    'locale': 'menu.form.basic-form',

                    'exact': true,

                }, {
                    'path': '/form/step-form',

                    'name': 'Step Form',

                    'locale': 'menu.form.step-form',

                    'exact': true,

                }, {
                    'path': '/form/advanced-form',

                    'name': 'Advanced Form',

                    'locale': 'menu.form.advanced-form',

                    'exact': true,

                }],
            'locale': 'menu.form',

        }, {
            'path': '/list',
            'name': 'List',
            icon: <TableOutlined/>,

            'children': [
                {
                    'path': '/list/search',
                    'name': 'Search List',

                    'locale': 'menu.list.search-list',

                    'children': [{
                        'path': '/list/search/articles',

                        'name': 'Search List(articles)',

                        'locale': 'menu.list.search-list.articles',

                        'exact': true,

                    }, {
                        'path': '/list/search/projects',

                        'name': 'Search List(projects)',

                        'locale': 'menu.list.search-list.projects',

                        'exact': true,

                    }, {
                        'path': '/list/search/applications',

                        'name': 'Search List(applications)',

                        'locale': 'menu.list.search-list.applications',

                        'exact': true,

                    }],

                }, {
                    'path': '/list/table-list',

                    'name': 'Search Table',

                    'locale': 'menu.list.table-list',

                    'exact': true,

                }, {
                    'path': '/list/basic-list',

                    'name': 'Basic List',

                    'locale': 'menu.list.basic-list',

                    'exact': true,

                }, {
                    'path': '/list/card-list',

                    'name': 'Card List',

                    'locale': 'menu.list.card-list',

                    'exact': true,

                }],
            'locale': 'menu.list',

        }, {
            'path': '/profile',
            'name': 'Profile',
            icon: <ProfileOutlined/>,

            'children': [
                {
                    'path': '/profile/basic',
                    'name': 'Basic Profile',

                    'locale': 'menu.profile.basic',

                    'exact': true,

                }, {
                    'path': '/profile/advanced',
                    'name': 'Advanced Profile',

                    'locale': 'menu.profile.advanced',

                    'exact': true,

                }],
            'locale': 'menu.profile',

        }, {
            'path': '/result',
            'name': 'Result',
            icon: <CheckCircleOutlined/>,

            'children': [
                {
                    'path': '/result/success',
                    'name': 'Success',

                    'locale': 'menu.result.success',

                    'exact': true,

                }, {
                    'path': '/result/fail',
                    'name': 'Fail',

                    'locale': 'menu.result.fail',

                    'exact': true,

                }],
            'locale': 'menu.result',

        }, {
            'path': '/exception',
            'name': 'Exception',
            icon: <WarningOutlined/>,

            'children': [
                {
                    'path': '/exception/403',
                    'name': '403',

                    'locale': 'menu.exception.403',

                    'exact': true,

                }, {
                    'path': '/exception/404',
                    'name': '404',

                    'locale': 'menu.exception.404',

                    'exact': true,

                }, {
                    'path': '/exception/500',
                    'name': '500',

                    'locale': 'menu.exception.500',

                    'exact': true,

                }],
            'locale': 'menu.exception',

        }, {
            'path': '/account',
            'name': 'Account',
            icon: <UserOutlined/>,

            'children': [
                {
                    'path': '/account/center',
                    'name': 'Account Center',

                    'locale': 'menu.account.center',

                    'exact': true,

                }, {
                    'path': '/account/settings',
                    'name': 'Account Settings',

                    'locale': 'menu.account.settings',

                    'exact': true,

                }],
            'locale': 'menu.account',

        }, {
            'path': '/editor',
            'name': 'Graphic Editor',
            icon: <HighlightOutlined/>,

            'children': [
                {
                    'path': '/editor/flow',
                    'name': 'Flow Editor',

                    'locale': 'menu.editor.flow',

                    'exact': true,

                }, {
                    'path': '/editor/mind',
                    'name': 'Mind Editor',

                    'locale': 'menu.editor.mind',

                    'exact': true,

                }, {
                    'path': '/editor/koni',
                    'name': 'Koni Editor',

                    'locale': 'menu.editor.koni',

                    'exact': true,

                }],
            'locale': 'menu.editor',

        },
    ])
    const menuItemRender = props.menuItemRender || ((props, item) => ((props.children) ? item : <Link href={props.path}><a>{item}</a></Link>))
    const onLogoClick = props.onLogoClick || (() => Router.push('/'))

    const menuData = menuDataRender()

    const toggleCollapsed = () => {
        setCollapsed(!collapsed)
    }

    return (
        <Layout css={layoutCss} as="section">
            <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapsed} css={sideMenuCss} as="aside"
                   style={props.sideMenuStyle}>
                {logo === 'sideMenu' ? <img css={logoCss} src="/logo.svg" onClick={onLogoClick}/> : null}
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                    {renderMenuData(menuData, menuItemRender, localeRender)}
                </Menu>
            </Sider>
            <Layout css={topMenuWrapperCss} style={props.topMenuWrapperStyle}>
                <Header css={topMenuCss} style={props.topMenuStyle}>
                    {logo === 'topMenu' ? <img css={logoTopCss} src="/logo.svg" onClick={onLogoClick}/> : null}
                    <MenuHeader/>
                    {/*<div css={trigger} onClick={toggleCollapsed}>*/}
                    {/*    {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {})}*/}
                    {/*</div>*/}
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

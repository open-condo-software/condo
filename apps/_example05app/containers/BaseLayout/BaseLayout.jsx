/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { useState } from 'react'
import { Breadcrumb, Layout, Menu } from 'antd'
import { DesktopOutlined, FileOutlined, PieChartOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'

import './antd-custom.less'
import MenuHeader from './components/MenuHeader'

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
    
    transition: all 0.2s;
    filter: brightness(10);
    
    .ant-layout-sider-collapsed & {
        height: 48px;
        margin: 8px 16px;
    }
`

function BaseLayout (props) {
    const [collapsed, setCollapsed] = useState(false)

    const toggleCollapsed = () => {
        setCollapsed(!collapsed)
    }

    return (
        <Layout css={layoutCss} as="section">
            <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapsed} css={sideMenuCss} as="aside"
                   style={props.sideMenuStyle}>
                <img css={logoCss} src="/logo.svg"/>
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                    <Menu.Item key="1" icon={<PieChartOutlined/>}>
                        Option 1
                    </Menu.Item>
                    <Menu.Item key="2" icon={<DesktopOutlined/>}>
                        Option 2
                    </Menu.Item>
                    <SubMenu key="sub1" icon={<UserOutlined/>} title="User">
                        <Menu.Item key="3">Tom</Menu.Item>
                        <Menu.Item key="4">Bill</Menu.Item>
                        <Menu.Item key="5">Alex</Menu.Item>
                    </SubMenu>
                    <SubMenu key="sub2" icon={<TeamOutlined/>} title="Team">
                        <Menu.Item key="6">Team 1</Menu.Item>
                        <Menu.Item key="8">Team 2</Menu.Item>
                    </SubMenu>
                    <Menu.Item key="9" icon={<FileOutlined/>}/>
                </Menu>
            </Sider>
            <Layout css={topMenuWrapperCss} style={props.topMenuWrapperStyle}>
                <Header css={topMenuCss} style={props.topMenuStyle}>
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

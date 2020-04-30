/** @jsx jsx */
import { css, jsx } from '@emotion/core'

import { useState } from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    VideoCameraOutlined,
    UploadOutlined,
    DesktopOutlined,
    PieChartOutlined,
    FileOutlined,
    TeamOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

import './antd-custom.less'
import MenuHeader from './components/MenuHeader'

const layout = css`
    height: 100%;
`

const layoutLeftMenu = css`
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
`;

const layoutHeader = css`
    background: #fff;
    padding: 0;
    box-shadow: 2px 0 6px rgba(0,21,41,.35);
`

const layoutContentWrapper = css`
`

const layoutContentBreadcrumb = css`
    margin: 16px;
    padding: 0 0 0 24px;
`

const layoutContent = css`
    margin: 16px;
    padding: 24px;
    min-height: 280px;
    background: white;
    border-radius: 2px;
`

const logo = css`
    height: 64px;
    margin: 0 24px;
    
    transition: all 0.2s;
    filter: brightness(10);
    
    .ant-layout-sider-collapsed & {
        height: 48px;
        margin: 8px 16px;
    }
`

function BaseLayout(props) {
    const [collapsed, setCollapsed] = useState(false)

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    return (
        <Layout css={layout} as="section">
            <Sider collapsible collapsed={collapsed} onCollapse={toggleCollapsed} css={layoutLeftMenu} as="aside">
                <img css={logo} src="/logo.svg" />
                <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
                    <Menu.Item key="1" icon={<PieChartOutlined />}>
                        Option 1
                    </Menu.Item>
                    <Menu.Item key="2" icon={<DesktopOutlined />}>
                        Option 2
                    </Menu.Item>
                    <SubMenu key="sub1" icon={<UserOutlined />} title="User">
                        <Menu.Item key="3">Tom</Menu.Item>
                        <Menu.Item key="4">Bill</Menu.Item>
                        <Menu.Item key="5">Alex</Menu.Item>
                    </SubMenu>
                    <SubMenu key="sub2" icon={<TeamOutlined />} title="Team">
                        <Menu.Item key="6">Team 1</Menu.Item>
                        <Menu.Item key="8">Team 2</Menu.Item>
                    </SubMenu>
                    <Menu.Item key="9" icon={<FileOutlined />} />
                </Menu>
            </Sider>
            <Layout>
                <Header css={layoutHeader}>
                    <MenuHeader/>
                    {/*<div css={trigger} onClick={toggleCollapsed}>*/}
                    {/*    {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {})}*/}
                    {/*</div>*/}
                </Header>
                <Content css={layoutContentWrapper} as="div">
                    <Breadcrumb css={layoutContentBreadcrumb}>
                        <Breadcrumb.Item>User</Breadcrumb.Item>
                        <Breadcrumb.Item>Bill</Breadcrumb.Item>
                    </Breadcrumb>
                    <div css={layoutContent} as="main">
                        {props.children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
}

export default BaseLayout;

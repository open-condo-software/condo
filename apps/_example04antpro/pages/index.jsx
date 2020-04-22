import BasicLayout from "../layout/BasicLayout";
import Head from "next/head";
import Router from 'next/router';
import Link from "next/link";

import { HeartTwoTone, SmileTwoTone, LogoutOutlined, HeatMapOutlined, RightOutlined } from '@ant-design/icons';
import { Card, Typography, Alert } from 'antd';
import { Avatar, Dropdown, Menu, Spin } from 'antd';

import { PageHeaderWrapper } from '@ant-design/pro-layout';

const PageContent = () => (
    <PageHeaderWrapper content="Hello admin title">
        <Card>
            <Alert
                message="run `yarn workspace @app/_example04antpro dev`"
                type="success"
                showIcon
                banner
                style={{
                    margin: -12,
                    marginBottom: 48,
                }}
            />
            <Typography.Title level={2} style={{ textAlign: 'center' }}>
                <SmileTwoTone/> Ant Design Pro <HeartTwoTone twoToneColor="#eb2f96"/> You
            </Typography.Title>
        </Card>
        <p style={{ textAlign: 'center', marginTop: 24 }}>
            Want to add more pages? Please refer to{' '}
            <a href="https://pro.ant.design/docs/block-cn" target="_blank" rel="noopener noreferrer">
                use block
            </a>
            。
        </p>
    </PageHeaderWrapper>
);

const GlobalHeaderRight = () => {
    const loading = false;
    const withDropdownMenu = false;

    const menu = (
        <Menu className="umi-plugin-layout-menu">
            <Menu.Item key="logout" onClick={console.log}>
                <LogoutOutlined />
                Logout
            </Menu.Item>
        </Menu>
    );

    const avatar = (
        <span className="umi-plugin-layout-action umi-plugin-layout-account">
        <Avatar
            size="small"
            className="umi-plugin-layout-avatar"
            src='https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png'
            alt="avatar"
        />
        <span className="umi-plugin-layout-name">
          Username!
        </span>
      </span>
    );

    if (loading) {
        return (
            <div className="umi-plugin-layout-right">
                <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }}/>
            </div>
        );
    }
    return (
        <div className="umi-plugin-layout-right">
            {withDropdownMenu ? (
                <Dropdown
                    overlay={menu}
                    overlayClassName="umi-plugin-layout-container"
                >
                    {avatar}
                </Dropdown>
            ) : (
                avatar
            )}
        </div>
    );
};


function HomePage() {
    return (<>
        <Head>
            <link rel="icon" href="/favicon.ico"/>
        </Head>
        <BasicLayout
            title="ADMIN" logo="/logo.colored.svg" navTheme="dark" menu={{ locale: true }} siderWidth={256}
            onMenuHeaderClick={e => {
                e.stopPropagation();
                e.preventDefault();
                Router.push('/');
            }}
            menuDataRender={() => [
                // type MenuDataItem
                { name: "test", path: "/test", icon: <HeatMapOutlined />, hideInMenu: false },
                { name: "m1", path: "/m1", icon: <RightOutlined />, children: [
                    { name: "test", path: "/m1/test", }]
                },
            ]}
            menuItemRender={(menuItemProps, defaultDom) => {
                if (menuItemProps.isUrl || menuItemProps.children) {
                    return defaultDom;
                }
                return <Link href={menuItemProps.path}><a>{defaultDom}</a></Link>;
            }}
            rightContentRender={() => (<GlobalHeaderRight/>)}
        >
            <PageContent/>
        </BasicLayout>
    </>);
}

export default HomePage;

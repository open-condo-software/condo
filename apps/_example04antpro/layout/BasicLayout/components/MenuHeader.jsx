import React from 'react'

import { Avatar, Dropdown, Menu, Spin } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'

import './MenuHeader.less'

const MenuHeader = () => {
    const loading = false
    const withDropdownMenu = true

    const menu = (
        <Menu className={'umi-plugin-layout-menu'}>
            <Menu.Item key="logout" onClick={console.log}>
                <LogoutOutlined/>
                Logout
            </Menu.Item>
        </Menu>
    )

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
    )

    if (loading) {
        return (
            <div className="umi-plugin-layout-right">
                <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }}/>
            </div>
        )
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
    )
}

export default MenuHeader

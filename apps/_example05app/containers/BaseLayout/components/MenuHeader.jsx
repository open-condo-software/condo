/** @jsx jsx */
import { css, jsx } from '@emotion/core'

import { Avatar, Dropdown, Menu, Spin } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useAuth } from '../../../lib/auth'

const headerRightWrapper = css`
  float: right;
  height: 100%;
  margin-left: auto;
  overflow: hidden;
`

const headerItem = css`
    display: inline-block;
    height: 100%;
    padding: 0 16px;
    cursor: pointer;
    transition: all 0.3s;
    > i {
        vertical-align: middle;
    }
    &:hover {
        background: rgba(0, 0, 0, 0.025);
    }
    .avatar {
        margin-right: 8px;
    }
`

const headerDropdownMenu = css`
`

const MenuHeader = (props) => {
    const auth = useAuth()
    const loading = Boolean(props.loading)
    const withDropdownMenu = true
    const avatarUrl = (auth.user && auth.user.avatar && auth.user.avatar.publicUrl) ? auth.user.avatar.publicUrl : 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png'

    const menu = (
        <Menu css={headerDropdownMenu}>
            <Menu.Item key="logout" onClick={auth.signout}>
                <LogoutOutlined/>
                Logout
            </Menu.Item>
        </Menu>
    )

    const avatar = (
        <div css={headerItem}>
            <Avatar
                size="small"
                src={avatarUrl}
                alt="avatar"
                className="avatar"
            />
            <span className="name">{auth.user ? auth.user.name : 'GUEST'}</span>
        </div>
    )

    if (loading) {
        return (
            <div css={headerRightWrapper}>
                <Spin size="small" style={{ marginLeft: 16, marginRight: 16 }}/>
            </div>
        )
    }

    return (
        <div css={headerRightWrapper}>
            {withDropdownMenu ? (<Dropdown overlay={menu}>{avatar}</Dropdown>) : (avatar)}
        </div>
    )
}

export default MenuHeader
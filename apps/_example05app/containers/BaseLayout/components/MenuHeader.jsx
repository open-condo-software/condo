/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Avatar, Dropdown, Menu, Spin } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

const headerRightWrapper = css`
  float: right;
  height: 100%;
  margin-left: auto;
  overflow: hidden;
`

const headerItem = css`
    display: inline-block;
    height: 100%;
    padding: 0 24px;
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
    const intl = useIntl()
    const loading = Boolean(props.loading)
    const withDropdownMenu = true
    const avatarUrl = (auth.user && auth.user.avatar && auth.user.avatar.publicUrl) ? auth.user.avatar.publicUrl : 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png'

    const SignOutMsg = intl.formatMessage({id: 'SignOut'})
    const SignInMsg = intl.formatMessage({id: 'SignIn'})
    const AvatarMsg = intl.formatMessage({id: 'Avatar'})
    const GuestUsernameMsg = intl.formatMessage({id: 'baselayout.menuheader.GuestUsername'})

    const menu = (
        <Menu css={headerDropdownMenu}>
            <Menu.Item key="signout" onClick={auth.signout}>
                <LogoutOutlined/> {SignOutMsg}
            </Menu.Item>
        </Menu>
    )

    const avatar = (
        <div css={headerItem}>
            <Avatar
                size="small"
                src={avatarUrl}
                alt={AvatarMsg}
                className="avatar"
            />
            <span className="name">{auth.user ? auth.user.name : GuestUsernameMsg}</span>
        </div>
    )

    const sigin = (
        <div css={headerItem} onClick={() => Router.push('/auth/signin')}>
            <span className="name">{SignInMsg}</span>
        </div>
    )

    if (loading) {
        return (
            <div css={headerRightWrapper}>
                <Spin size="small" style={{ marginLeft: 16, marginRight: 16 }}/>
            </div>
        )
    }

    const signedInItems = withDropdownMenu ? (<Dropdown overlay={menu}>{avatar}</Dropdown>) : (avatar)
    const signedOutItems = (sigin)

    return (
        <div css={headerRightWrapper}>
            {auth.isAuthenticated ? signedInItems : signedOutItems}
        </div>
    )
}

export default MenuHeader
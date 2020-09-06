/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Dropdown, Menu, Spin } from 'antd'
import { useIntl } from 'react-intl'
import { LogoutOutlined } from '@ant-design/icons'
import Router from 'next/router'

import { useAuth } from '@core/next/auth'
import {CustomAvatar} from "./CustomAvatar";

const headerRightWrapper = css`
    display: flex;
    flex-direction: row;
    justify_content: space-between;
    max-width: 1024px;
    margin:auto;
    height: 100%;
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

const customAvatar = css`
    ${headerItem};
    margin-left: auto;
`

const headerDropdownMenu = css`
`

const MenuHeader = (props) => {
    const auth = useAuth()
    const intl = useIntl()
    const loading = Boolean(props.loading)
    const withDropdownMenu = true

    const SignOutMsg = intl.formatMessage({id: 'SignOut'})
    const SignInMsg = intl.formatMessage({id: 'SignIn'})

    const menu = (
        <Menu css={headerDropdownMenu}>
            <Menu.Item key="signout" onClick={auth.signout}>
                <LogoutOutlined/> {SignOutMsg}
            </Menu.Item>
        </Menu>
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

    const signedInItems = withDropdownMenu
        ? (
            <Dropdown overlay={menu}>
                <CustomAvatar auth={auth} styles={customAvatar}/>
            </Dropdown>
        )
        : <CustomAvatar auth={auth} styles={customAvatar}/>

    return (
        <div css={headerRightWrapper}>
            {auth.isAuthenticated ? signedInItems : sigin}
        </div>
    )
}

export default MenuHeader

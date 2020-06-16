import { Avatar, Dropdown, Menu, Spin, Tag } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import styled from '@emotion/styled'

const TopMenuLeftWrapper = styled.div`
  float: left;
  height: 100%;
  margin-left: auto;
  overflow: hidden;
`

const TopMenuRightWrapper = styled.div`
  float: right;
  height: 100%;
  margin-left: auto;
  overflow: hidden;
`

const TopMenuItem = styled.div`
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

const TopMenu = (props) => {
    const auth = useAuth()
    const organization = useOrganization()
    const loading = Boolean(props.loading)
    const withDropdownMenu = true
    const avatarUrl = (auth.user && auth.user.avatar && auth.user.avatar.publicUrl) ? auth.user.avatar.publicUrl : 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png'

    const intl = useIntl()
    const SignOutMsg = intl.formatMessage({ id: 'SignOut' })
    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const AvatarMsg = intl.formatMessage({ id: 'Avatar' })
    const OwnerMsg = intl.formatMessage({ id: 'Owner' })
    const GuestUsernameMsg = intl.formatMessage({ id: 'baselayout.menuheader.GuestUsername' })

    if (loading) {
        return (
            <div>
                <Spin size="small" style={{ marginLeft: 16, marginRight: 16 }}/>
            </div>
        )
    }

    const menu = (
        <Menu>
            <Menu.Item key="signout" onClick={auth.signout}>
                <LogoutOutlined/> {SignOutMsg}
            </Menu.Item>
        </Menu>
    )

    const avatar = (
        <TopMenuItem>
            <Avatar
                size="small"
                src={avatarUrl}
                alt={AvatarMsg}
                className="avatar"
            />
            <span className="name">{auth.user ? auth.user.name : GuestUsernameMsg}</span>
        </TopMenuItem>
    )

    const sigin = (
        <TopMenuItem onClick={() => Router.push('/auth/signin')}>
            <span className="name">{SignInMsg}</span>
        </TopMenuItem>
    )

    const signedInItems = withDropdownMenu ? (<Dropdown overlay={menu}>{avatar}</Dropdown>) : (avatar)
    const signedOutItems = (sigin)

    const organizationName = (organization && organization.organization) ? <TopMenuItem
        onClick={() => Router.push('/organizations')}>
        {organization.organization.name}{' '}
        {(organization.link && organization.link.role === 'owner') ? <Tag color="error">{OwnerMsg}</Tag> : null}
    </TopMenuItem> : null

    return (<>
        <TopMenuLeftWrapper>{organizationName}</TopMenuLeftWrapper>
        <TopMenuRightWrapper>
            {auth.isAuthenticated ? signedInItems : signedOutItems}
        </TopMenuRightWrapper>
    </>)
}

export default TopMenu
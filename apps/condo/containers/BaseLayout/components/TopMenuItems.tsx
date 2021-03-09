// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React from 'react'
import get from 'lodash/get'
import { Avatar, Dropdown, Menu, Spin, Tag } from 'antd'
import { LogoutOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { TopMenuItem, TopMenuLeftWrapper, TopMenuRightWrapper } from './styles'

function goToSignin () {
    Router.push('/auth/signin')
}

function goToOrganization () {
    Router.push('/organizations')
}

interface ITopMenuItemsProps {
    isMobile: boolean
    toggleSideMenuCollapsed: boolean
}

const TopMenuItems:React.FunctionComponent<ITopMenuItemsProps> =  (props) => {
    const auth = useAuth()
    const { isLoading, organization, link } = useOrganization()
    const intl = useIntl()

    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const AvatarMessage = intl.formatMessage({ id: 'Avatar' })
    const OwnerMessage = intl.formatMessage({ id: 'Owner' })
    const GuestUsernameMessage = intl.formatMessage({ id: 'baselayout.menuheader.GuestUsername' })
    const avatarUrl = get(auth, ['user', 'avatar', 'publicUrl'], 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png')

    const { isMobile, toggleSideMenuCollapsed } = props

    if (isLoading || auth.isLoading) {
        return (
            <div>
                <Spin size="small" style={{ marginLeft: 16, marginRight: 16 }}/>
            </div>
        )
    }

    const DropdownOverlay = (
        <Menu>
            <Menu.Item key="signout" onClick={auth.signout}>
                <LogoutOutlined/> {SignOutMessage}
            </Menu.Item>
        </Menu>
    )

    return (
        <>
            {
                isMobile
                    ? <TopMenuLeftWrapper className={'top-menu-side-menu-toggle'}>
                        <TopMenuItem onClick={toggleSideMenuCollapsed}><MenuUnfoldOutlined/></TopMenuItem>
                    </TopMenuLeftWrapper>
                    : null
            }
            {
                organization
                    ? <TopMenuLeftWrapper>
                        <TopMenuItem onClick={goToOrganization}>
                            <div className="ellipsable">
                                {organization.name}{' '}
                                {
                                    (get(link, 'role') === 'owner')
                                        ? <Tag color="error" className="tag">{OwnerMessage}</Tag>
                                        : null
                                }
                            </div>
                        </TopMenuItem>
                    </TopMenuLeftWrapper>
                    : null
            }
            <TopMenuRightWrapper>
                {
                    auth.isAuthenticated
                        ? (
                            <Dropdown overlay={DropdownOverlay}>
                                <TopMenuItem>
                                    <Avatar
                                        size="small"
                                        src={avatarUrl}
                                        alt={AvatarMessage}
                                        className="avatar"
                                    />
                                    <span className="name">{auth.user ? auth.user.name : GuestUsernameMessage}</span>
                                </TopMenuItem>
                            </Dropdown>
                        )
                        : <TopMenuItem onClick={goToSignin}>
                            <span className="link">{SignInMessage}</span>
                        </TopMenuItem>
                }
            </TopMenuRightWrapper>
        </>
    )
}

export default TopMenuItems

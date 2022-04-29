import styled from '@emotion/styled'
import { Dropdown, Space, Menu } from 'antd'
import { RestFilled } from '@ant-design/icons'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import {
    TopMenuItem,
    StyledMenuItem,
    MENU_ICON_STYLES,
} from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import React, { useMemo } from 'react'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { green } from '@ant-design/colors'
import { Button } from '@condo/domains/common/components/Button'

function goToSignin () {
    Router.push('/auth/signin')
}

function goToUserProfile () {
    Router.push('/user')
}

function formatUserName (name) {
    const splittedName = name.split(' ')
    return splittedName[0]
}

export const StyledMenu = styled(Menu)`
  padding: 20px;
  width: 210px;
  box-sizing: border-box;
  border-radius: 8px;
  transform: translate(-5%, 10px);
`

const AvatarContainer = styled.div`
  width: 24px;
  height: 24px;
`

const UserMenuWrapper = styled.div`
`

const UserMenuContainer = styled.div`
  height: 24px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
`

export const DesktopUserMenu: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const GuestUsernameMessage = intl.formatMessage({ id: 'baselayout.menuheader.GuestUsername' })
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const auth = useAuth()

    const userName = useMemo(() => {
        if (auth.user) {
            return formatUserName(auth.user.name)
        } else {
            return GuestUsernameMessage
        }
    }, [auth.user])

    const DropdownOverlay = (
        <StyledMenu>
            <StyledMenuItem key='signout' onClick={auth.signout}>
                <Space size={16}>
                    <RestFilled style={MENU_ICON_STYLES}/>
                    {SignOutMessage}
                </Space>
            </StyledMenuItem>
        </StyledMenu>
    )

    return (
        <UserMenuWrapper>
            {
                auth.isAuthenticated
                    ? (
                        <Dropdown overlay={DropdownOverlay} placement='bottomCenter'>
                            <UserMenuContainer>
                                <Button
                                    type='link'
                                    style={{ paddingRight: 0, color: green[6], fontSize: '12px' }}
                                    onClick={goToUserProfile}
                                >
                                    <Space size={16}>
                                        <AvatarContainer>
                                            <UserAvatar iconSize={'6px'}/>
                                        </AvatarContainer>
                                        {userName}
                                    </Space>
                                </Button>
                            </UserMenuContainer>
                        </Dropdown>
                    )
                    : <TopMenuItem onClick={goToSignin}>
                        <span className='link'>{SignInMessage}</span>
                    </TopMenuItem>
            }
        </UserMenuWrapper>
    )
}

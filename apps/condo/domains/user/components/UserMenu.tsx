// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import styled from '@emotion/styled'
// @ts-nocheck
import { Dropdown, Tag, Space, Menu } from 'antd'
import { EnvironmentFilled, RestFilled } from '@ant-design/icons'
import { UserAvatar } from '@condo/domains/user/components/UserAvatar'
import {
    TopMenuItem,
    StyledMenuItem,
    menuIconStyles,
} from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import React from 'react'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { useOrganization } from '@core/next/organization'
import { green } from '@ant-design/colors'
import { Button } from '@condo/domains/common/components/Button'

function goToSignin () {
    Router.push('/auth/signin')
}

function goToOrganization () {
    Router.push('/organizations')
}

function formatUserName (name) {
    const splittedName = name.split(' ')

    if (splittedName.length > 1) {
        return splittedName[0] + '...'
    } else {
        return name
    }
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
  padding-left: 44px;
`

const UserMenuContainer = styled.div`
  height: 24px;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
`

export const UserMenu = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const GuestUsernameMessage = intl.formatMessage({ id: 'baselayout.menuheader.GuestUsername' })
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const OwnerMessage = intl.formatMessage({ id: 'Owner' })
    const auth = useAuth()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization, link } = useOrganization()

    const DropdownOverlay = (
        <StyledMenu>
            {organization && (
                <StyledMenuItem onClick={goToOrganization}>
                    <Space size={16}>
                        <EnvironmentFilled style={menuIconStyles}/>
                        <>
                            {organization.name + ' '}
                            {get(link, 'role') === 'owner' && <Tag color="error" className="tag">{OwnerMessage}</Tag>}
                        </>
                    </Space>
                </StyledMenuItem>
            )}
            <StyledMenuItem key="signout" onClick={auth.signout}>
                <Space size={16}>
                    <RestFilled style={menuIconStyles}/>
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
                                <Space size={1}>
                                    <AvatarContainer>
                                        <UserAvatar/>
                                    </AvatarContainer>
                                    <Button type='link' style={{ paddingRight: 0, color: green[6], fontSize: '12px' }}>
                                        {auth.user ? formatUserName(auth.user.name) : GuestUsernameMessage}
                                    </Button>
                                </Space>
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

import styled from '@emotion/styled'
import { Dropdown, Space, Menu, Avatar } from 'antd'
import { RestFilled } from '@ant-design/icons'
import { StyledMenuItem, menuIconStyles } from '@condo/domains/common/components/containers/BaseLayout/components/styles'
import React from 'react'
import Router, { useRouter } from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { UserOutlined } from '@ant-design/icons'

function goToSignin () {
    Router.push('/auth/signin')
}

// TODO(Dimitreee):refactor later
export const StyledMenu = styled(Menu)`
  padding: 20px;
  width: 210px;
  box-sizing: border-box;
  border-radius: 8px;
  transform: translate(-5%, 10px);
`

const USER_ACTIONS_OPEN_DROPDOWN_TRIGGERS: ('hover' | 'click' | 'contextMenu')[] = ['hover', 'click']

export const MobileUserMenu: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const ProfileMessage = intl.formatMessage({ id: 'profile' })

    const auth = useAuth()
    const router = useRouter()

    const DropdownOverlay = (
        <StyledMenu>
            <StyledMenuItem key='profile' onClick={() => router.push('/user')}>
                <Space size={16}>
                    <UserOutlined style={menuIconStyles}/>
                    {ProfileMessage}
                </Space>
            </StyledMenuItem>
            <StyledMenuItem key='signout' onClick={auth.signout}>
                <Space size={16}>
                    <RestFilled style={menuIconStyles}/>
                    {SignOutMessage}
                </Space>
            </StyledMenuItem>
        </StyledMenu>
    )

    return (
        auth.isAuthenticated
            ? (
                <Dropdown
                    overlay={DropdownOverlay}
                    placement='bottomLeft'
                    trigger={USER_ACTIONS_OPEN_DROPDOWN_TRIGGERS}
                >
                    <Button type={'inlineLink'} icon={<Avatar size={40} icon={<UserOutlined/>}/>}/>
                </Dropdown>
            )
            : <Button type='inlineLink' onClick={goToSignin}>{SignInMessage}</Button>
    )
}

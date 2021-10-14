import styled from '@emotion/styled'
import { Dropdown, Menu, Avatar } from 'antd'
import { RestFilled } from '@ant-design/icons'
import React from 'react'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { UserOutlined } from '@ant-design/icons'
import { MenuItem } from '@condo/domains/common/components/MenuItem'
import { fontSizes, shadows, colors } from '@condo/domains/common/constants/style'

function goToSignin () {
    Router.push('/auth/signin')
}

// TODO (Dimitreee): think about encapsulation
export const StyledMenu = styled(Menu)`
  width: 225px;
  box-sizing: border-box;
  border-radius: 8px;
`

const UerAvatarWrapper = styled.div`
  height: 40px;
  width: 40px;
  line-height: 100%;
  border-radius: 50%;
  border: 2px solid ${colors.white};
  box-shadow: ${shadows.elevated};
`

export const UserMenu: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'SignIn' })
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
    const auth = useAuth()

    const ResidentAppealDropDownMenuItemWrapperProps = {
        onClick: () => auth.signout(),
        labelFontSize: fontSizes.label,
        padding: '16px',
    }

    const DropdownOverlay = (
        <StyledMenu>
            <MenuItem
                path={'/auth/signin'}
                menuItemWrapperProps={ResidentAppealDropDownMenuItemWrapperProps}
                key='signout'
                icon={RestFilled}
                label={SignOutMessage}
            />
        </StyledMenu>
    )

    return (
        auth.isAuthenticated
            ? (
                <Dropdown overlay={DropdownOverlay} placement='bottomLeft'>
                    <UerAvatarWrapper>
                        <Avatar size={36} icon={<UserOutlined/>}/>
                    </UerAvatarWrapper>
                </Dropdown>
            )
            : <Button type='inlineLink' onClick={goToSignin}>{SignInMessage}</Button>
    )
}

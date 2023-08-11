import { Dropdown } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { MoreVertical } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'
import type { TypographyTextProps } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import type { DropdownProps } from 'antd'

function formatUserName (name) {
    const splittedName = name.split(' ')
    return splittedName[0]
}

const DROPDOWN_OVERLAY_STYLES: CSSProperties = { maxWidth: 180, width: '100%' }

export const UserMenu: React.FC = () => {
    const { breakpoints } = useLayoutContext()

    const intl = useIntl()
    const MyProfileMessage = intl.formatMessage({ id: 'profile' })
    const SignOutMessage = intl.formatMessage({ id: 'signOut' })
    const auth = useAuth()
    const router = useRouter()
    const userName = formatUserName(get(auth, ['user', 'name'], ''))

    const handleProfileClick = useCallback(() => {
        router.push('/user')
    }, [router])

    const handleSignOutClick = useCallback(() => {
        auth.signout()
    }, [auth])

    const menu = useMemo<DropdownProps['menu']>(() => {
        return {
            items: [
                {
                    key: 'profile',
                    label: (
                        <Typography.Text size='medium' type='inherit'>{MyProfileMessage}</Typography.Text>
                    ),
                    onClick: handleProfileClick,
                },
                {
                    key: 'signOut',
                    label: (
                        <Typography.Text size='medium' type='inherit'>{SignOutMessage}</Typography.Text>
                    ),
                    onClick: handleSignOutClick,
                },
            ],
        }
    }, [MyProfileMessage, SignOutMessage, handleProfileClick, handleSignOutClick])

    const textSize: TypographyTextProps['size'] = !breakpoints.TABLET_LARGE ? 'small' : 'medium'

    return (
        <Dropdown placement='bottomRight' menu={menu} overlayClassName='user-dropdown-overlay' overlayStyle={DROPDOWN_OVERLAY_STYLES}>
            <Space size={8} direction='horizontal' className='user-dropdown'>
                <Typography.Text size={textSize} onClick={handleProfileClick}>
                    {userName}
                </Typography.Text>
                <div className='expand-icon-wrapper'>
                    <MoreVertical size='small'/>
                </div>
            </Space>
        </Dropdown>
    )
}

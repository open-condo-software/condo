import { Dropdown } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { MoreVertical } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Space } from '@open-condo/ui'

import type { DropdownProps } from 'antd'

function formatUserName (name) {
    const splittedName = name.split(' ')
    return splittedName[0]
}

export const DesktopUserMenu: React.FC = () => {
    const intl = useIntl()
    const MyProfileMessage = intl.formatMessage({ id: 'profile' })
    const SignOutMessage = intl.formatMessage({ id: 'SignOut' })
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



    return (
        <Dropdown placement='bottom' menu={menu} overlayClassName='user-dropdown-overlay'>
            <Space size={8} direction='horizontal' className='user-dropdown'>
                <Typography.Text size='medium' onClick={handleProfileClick}>
                    {userName}
                </Typography.Text>
                <div className='expand-icon-wrapper'>
                    <MoreVertical size='small'/>
                </div>
            </Space>
        </Dropdown>
    )
}

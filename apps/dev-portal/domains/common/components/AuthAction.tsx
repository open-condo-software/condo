import { Dropdown, DropdownProps } from 'antd'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { MoreVertical } from '@open-condo/icons'
import { Button, Space, Typography } from '@open-condo/ui'

import { useAuth } from '@/lib/auth'

export const AuthAction: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'global.header.signIn' })
    const SignOutMessage = intl.formatMessage({ id: 'global.header.signOut' })
    const { isLoading, isAuthenticated, user, signIn, signOut } = useAuth()

    const menu: DropdownProps['menu'] = useMemo(() => ({
        items: [
            {
                key: 'signOut',
                label: SignOutMessage,
                onClick: signOut,
            },
        ],
    }), [SignOutMessage, signOut])

    if (isLoading) {
        return null
    }

    if (isAuthenticated) {
        return (
            <Dropdown placement='bottomRight' menu={menu}>
                <Space size={8} direction='horizontal'>
                    <Typography.Text>{user.name}</Typography.Text>
                    <MoreVertical size='small'/>
                </Space>
            </Dropdown>
        )
    }

    return (
        <Button type='primary' onClick={() => signIn('', '')}>{SignInMessage}</Button>
    )
}
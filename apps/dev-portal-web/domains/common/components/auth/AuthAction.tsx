import { Dropdown, DropdownProps } from 'antd'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { MoreVertical } from '@open-condo/icons'
import { Button, Space, Typography } from '@open-condo/ui'

import { useAuth } from '@/domains/user/utils/auth'

import styles from './AuthAction.module.css'


const MAX_NAME_LENGTH = 18

function formatName (name?: string | null) {
    if (!name) return name
    if (name.length <= MAX_NAME_LENGTH) {
        return name
    }
    return name.split(' ')[0]
}

type UserBadgeProps = {
    dropdownPlacement: DropdownProps['placement']
}

export const UserBadge: React.FC<UserBadgeProps> = ({ dropdownPlacement }) => {
    const intl = useIntl()
    const SignOutMessage = intl.formatMessage({ id: 'global.actions.signOut' })
    const { user, signOut } = useAuth()

    const menu: DropdownProps['menu'] = useMemo(() => ({
        items: [
            {
                key: 'signOut',
                label: SignOutMessage,
                onClick: signOut,
            },
        ],
    }), [SignOutMessage, signOut])

    return (
        <Dropdown placement={dropdownPlacement} menu={menu}>
            <Space size={8} direction='horizontal'>
                <span className={styles.userNameContainer}>
                    <Typography.Paragraph ellipsis>{formatName(user?.name)}</Typography.Paragraph>
                </span>
                <MoreVertical size='small'/>
            </Space>
        </Dropdown>
    )
}

export const AuthHeaderAction: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'global.actions.signIn' })
    const { isAuthenticated, startSignIn } = useAuth()

    return (
        <>
            {isAuthenticated ? (
                <UserBadge dropdownPlacement='bottomRight'/>
            ) : (
                <Button type='primary' onClick={startSignIn}>{SignInMessage}</Button>
            )}
        </>
    )
}
import { Dropdown, DropdownProps } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { MoreVertical } from '@open-condo/icons'
import { Button, Space, Typography, Modal } from '@open-condo/ui'

import { AuthForm } from './AuthForm'

import { useAuth } from '@/lib/auth'

export const AuthHeaderAction: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'global.header.signIn' })
    const SignOutMessage = intl.formatMessage({ id: 'global.header.signOut' })
    const { isLoading, isAuthenticated, user, signOut } = useAuth()
    const [loginModalOpen, setLoginModalOpen] = useState(false)

    const handleModalOpen = useCallback(() => {
        setLoginModalOpen(true)
    }, [])
    const handleModalClose = useCallback(() => {
        setLoginModalOpen(false)
    }, [])

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
        <>
            <Button type='primary' onClick={handleModalOpen}>{SignInMessage}</Button>
            {loginModalOpen && (
                <Modal
                    open={loginModalOpen}
                    onCancel={handleModalClose}
                >
                    <AuthForm/>
                </Modal>
            )}
        </>
    )
}
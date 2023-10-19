import { Dropdown, DropdownProps } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { MoreVertical } from '@open-condo/icons'
import { Button, Space, Typography, Modal } from '@open-condo/ui'

import styles from './AuthAction.module.css'
import { AuthForm } from './AuthForm'

import { useAuth } from '@/lib/auth'

const MAX_NAME_LENGTH = 18

function formatName (name?: string | null) {
    if (!name) return name
    if (name.length <= MAX_NAME_LENGTH) {
        return name
    }
    return name.split(' ')[0]
}

export const AuthHeaderAction: React.FC = () => {
    const intl = useIntl()
    const SignInMessage = intl.formatMessage({ id: 'global.action.signIn' })
    const SignOutMessage = intl.formatMessage({ id: 'global.action.signOut' })
    const { isAuthenticated, user, signOut, refetchAuth } = useAuth()
    const [loginModalOpen, setLoginModalOpen] = useState(false)

    const handleModalOpen = useCallback(() => {
        setLoginModalOpen(true)
    }, [])
    const handleModalClose = useCallback(() => {
        setLoginModalOpen(false)
    }, [])
    const handleAuthComplete = useCallback(() => {
        refetchAuth().then(handleModalClose)
    }, [refetchAuth, handleModalClose])

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
        <>
            {loginModalOpen && (
                <Modal
                    open={loginModalOpen}
                    onCancel={handleModalClose}
                >
                    <AuthForm onComplete={handleAuthComplete}/>
                </Modal>
            )}
            {isAuthenticated ? (
                <Dropdown placement='bottomRight' menu={menu}>
                    <Space size={8} direction='horizontal'>
                        <span className={styles.userNameContainer}>
                            <Typography.Paragraph ellipsis>{formatName(user?.name)}</Typography.Paragraph>
                        </span>
                        <MoreVertical size='small'/>
                    </Space>
                </Dropdown>
            ) : (
                <Button type='primary' onClick={handleModalOpen}>{SignInMessage}</Button>
            )}
        </>
    )
}
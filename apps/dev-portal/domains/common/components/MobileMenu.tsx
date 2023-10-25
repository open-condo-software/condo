import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Menu, Close } from '@open-condo/icons'
import { Button, Space, Typography } from '@open-condo/ui'

import { UserBadge } from './auth/AuthAction'
import { LanguageSwitcher } from './LanguageSwitcher'
import styles from './MobileMenu.module.css'

import { useAuth } from '@/lib/auth'

const MobileMenuAction: React.FC = () => {
    const intl = useIntl()
    const { isAuthenticated, startSignIn } = useAuth()
    const SignInMessage = intl.formatMessage({ id: 'global.action.signIn' })
    const CreateAppMessage = intl.formatMessage({ id: 'global.action.createApp' })

    return (
        <div className={styles.mobileActionContainer}>
            {isAuthenticated ? (
                <Button type='secondary' block disabled>{CreateAppMessage}</Button>
            ) : (
                <Button type='primary' block onClick={startSignIn}>{SignInMessage}</Button>
            )}
        </div>
    )
}

const MobileAuthPanel: React.FC = () => {
    const { isAuthenticated } = useAuth()
    return (
        <div className={styles.mobileAuthPanel}>
            <LanguageSwitcher dropdownPlacement='topLeft'/>
            {isAuthenticated && (
                <UserBadge dropdownPlacement='topRight'/>
            )}
        </div>
    )
}

export const MobileMenu: React.FC = () => {
    const intl = useIntl()
    const DocsSectionTitle = intl.formatMessage({ id: 'global.navBar.documentation.title' })
    const AppsSectionTitle = intl.formatMessage({ id: 'global.navBar.apps.title' })
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const Icon = isOpen ? Close : Menu

    const handleMenuChange = useCallback(() => {
        setIsOpen(prev => !prev)
    }, [])

    const handleDocsClick = useCallback(() => {
        router.push('/docs/index', '/docs/index', { locale: router.locale }).then(() => {
            setIsOpen(false)
        })
    }, [router])

    return (
        <>
            <Icon size='large' className={styles.menuActionIcon} onClick={handleMenuChange}/>
            {isOpen && (
                <div className={styles.menuContainer}>
                    <Space size={16} direction='vertical' className={styles.mobileMenuContainer}>
                        <Typography.Title level={4} type='inherit' onClick={handleDocsClick}>{DocsSectionTitle}</Typography.Title>
                        <Typography.Title level={4} type='inherit'>{AppsSectionTitle}</Typography.Title>
                    </Space>
                    <MobileAuthPanel/>
                    <MobileMenuAction/>
                </div>
            )}
        </>
    )
}
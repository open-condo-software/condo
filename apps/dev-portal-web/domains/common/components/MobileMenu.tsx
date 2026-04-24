import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { Menu, Close } from '@open-condo/icons'
import { Button, Space, Typography } from '@open-condo/ui'

import { useCreateAppContext } from '@/domains/common/components/CreateAppContext'
import { useAuth } from '@/domains/user/utils/auth'

import { UserBadge } from './auth/AuthAction'
import { LanguageSwitcher } from './LanguageSwitcher'
import styles from './MobileMenu.module.css'


const MobileMenuAction: React.FC = () => {
    const intl = useIntl()
    const { isAuthenticated, startSignIn } = useAuth()
    const SignInMessage = intl.formatMessage({ id: 'global.actions.signIn' })
    const CreateAppMessage = intl.formatMessage({ id: 'global.actions.createApp' })
    const { createApp } = useCreateAppContext()

    return (
        <div className={styles.mobileActionContainer}>
            {isAuthenticated ? (
                <Button type='secondary' block onClick={createApp}>{CreateAppMessage}</Button>
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
    const DocsSectionTitle = intl.formatMessage({ id: 'global.service.sections.docs' })
    const AppsSectionTitle = intl.formatMessage({ id: 'global.service.sections.apps' })
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const { isAuthenticated, startSignIn, isLoading } = useAuth()

    const Icon = isOpen ? Close : Menu

    const handleMenuChange = useCallback(() => {
        setIsOpen(prev => !prev)
    }, [])

    const handleDocsClick = useCallback(() => {
        router.push('/docs/index', '/docs/index', { locale: router.locale }).then(() => {
            setIsOpen(false)
        })
    }, [router])

    const handleAppsClick = useCallback(() => {
        if (isLoading) {
            return
        }
        if (isAuthenticated) {
            router.push('/apps', '/apps', { locale: router.locale }).then(() => {
                setIsOpen(false)
            })
        } else {
            startSignIn()
        }
    }, [isAuthenticated, isLoading, startSignIn, router])

    return (
        <>
            <Icon size='large' className={styles.menuActionIcon} onClick={handleMenuChange}/>
            {isOpen && (
                <div className={styles.menuContainer}>
                    <Space size={16} direction='vertical' className={styles.mobileMenuContainer}>
                        <Typography.Title level={4} type='inherit' onClick={handleDocsClick}>{DocsSectionTitle}</Typography.Title>
                        <Typography.Title level={4} type='inherit' onClick={handleAppsClick}>{AppsSectionTitle}</Typography.Title>
                    </Space>
                    <MobileAuthPanel/>
                    <MobileMenuAction/>
                </div>
            )}
        </>
    )
}
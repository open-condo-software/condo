import { Montserrat } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Space, Typography } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import { RecentAppsPopover } from '@/domains/miniapp/components/RecentAppsPopover'
import { useAuth } from '@/domains/user/utils/auth'

import { AuthHeaderAction } from './auth/AuthAction'
import styles from './Header.module.css'
import { LanguageSwitcher } from './LanguageSwitcher'
import { MobileMenu } from './MobileMenu'


const logoFont = Montserrat({
    subsets: ['latin', 'cyrillic'],
    style: ['normal'],
    weight: '600',
})

export const Header: React.FC = () => {
    const intl = useIntl()
    const ServiceShortTitle = intl.formatMessage({ id: 'global.service.name.short' })
    const DocsSectionTitle = intl.formatMessage({ id: 'global.service.sections.docs' })
    const AppsSectionTitle = intl.formatMessage({ id: 'global.service.sections.apps' })
    const router = useRouter()
    const breakpoints = useBreakpoints()
    const isLargeLayout = Boolean(breakpoints.DESKTOP_SMALL)
    const { isAuthenticated, startSignIn } = useAuth()

    const handleDocsClick = useCallback(() => {
        router.push('/docs/index', '/docs/index', { locale: router.locale })
    }, [router])
    const handleAppsClick = useCallback(() => {
        if (isAuthenticated) {
            router.push('/apps', '/apps', { locale: router.locale })
        } else {
            startSignIn()
        }

    }, [router, startSignIn, isAuthenticated])

    const MyAppsWrapper = useMemo(() => (isAuthenticated ? RecentAppsPopover : React.Fragment), [isAuthenticated])

    return (
        <header className={styles.header}>
            <Space direction='horizontal' size={40}>
                <Link href='/' className={styles.logoContainer} locale={router.locale}>
                    <div className={styles.logoImageWrapper}>
                        <Image className={styles.logo} src='/logo.svg' alt='Logo' fill priority draggable={false}/>
                    </div>
                    <span
                        className={`${logoFont.className} ${styles.logoText}`}
                    >
                        {ServiceShortTitle}
                    </span>
                </Link>
                {isLargeLayout && (
                    <Space direction='horizontal' size={20} className={styles.navbarItemsContainer}>
                        <Typography.Title level={4} type='inherit' onClick={handleDocsClick}>
                            {DocsSectionTitle}
                        </Typography.Title>
                        <MyAppsWrapper>
                            <Typography.Title level={4} type='inherit' onClick={handleAppsClick}>
                                {AppsSectionTitle}
                            </Typography.Title>
                        </MyAppsWrapper>
                    </Space>
                )}
            </Space>
            <Space direction='horizontal' align='center' size={20}>
                {isLargeLayout ? (
                    <>
                        <LanguageSwitcher dropdownPlacement='bottom'/>
                        <AuthHeaderAction/>
                    </>
                ) : (
                    <MobileMenu/>
                )}

            </Space>
        </header>
    )
}
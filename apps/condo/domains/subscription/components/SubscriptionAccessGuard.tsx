import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Space } from '@open-condo/ui'

import styles from './SubscriptionAccessGuard.module.css'

import { PageHeader, PageWrapper } from '../../common/components/containers/BaseLayout'
import { requiresSubscriptionAccess, getRequiredFeature } from '../constants/routeFeatureMapping'
import { useOrganizationSubscription } from '../hooks/useOrganizationSubscription'


const { Title, Paragraph } = Typography

interface SubscriptionAccessGuardProps {
    children: React.ReactNode
}

/**
 * Get page title based on current route
 */
const getPageTitle = (pathname: string, intl: any): string => {
    const routeTitleMap: Record<string, string> = {
        '/news': intl.formatMessage({ id: 'global.section.news' }),
        '/marketplace': intl.formatMessage({ id: 'global.section.marketplace' }),
    }

    // Check exact match first
    if (routeTitleMap[pathname]) {
        return routeTitleMap[pathname]
    }

    // Check if pathname starts with any of the mapped routes
    for (const route in routeTitleMap) {
        if (pathname.startsWith(route + '/')) {
            return routeTitleMap[route]
        }
    }

    // Default fallback
    return intl.formatMessage({ id: 'subscription.accessGuard.defaultPageTitle' })
}

/**
 * Guard component that checks subscription access for protected routes
 * Blocks content completely and shows access denied screen
 */
export const SubscriptionAccessGuard: React.FC<SubscriptionAccessGuardProps> = ({ children }) => {
    const router = useRouter()
    const intl = useIntl()
    const { subscription, isExpired, isFeatureAvailable, loading } = useOrganizationSubscription()

    const pageTitle = useMemo(() => {
        return getPageTitle(router.pathname, intl)
    }, [router.pathname, intl])

    const isBlocked = useMemo(() => {
        const currentPath = router.pathname

        // Skip check if route doesn't require subscription
        if (!requiresSubscriptionAccess(currentPath)) {
            return false
        }
        
        // Skip check if subscription data is still loading
        if (loading) {
            return false
        }
        
        // Check if user has active subscription
        if (!subscription || isExpired) {
            return true
        }
        
        // Check if specific feature is required
        const requiredFeature = getRequiredFeature(currentPath)
        if (requiredFeature && !isFeatureAvailable(requiredFeature)) {
            return true
        }

        return false
    }, [router.pathname, subscription, isExpired, isFeatureAvailable, loading])

    const handleGoToPlans = useCallback(() => {
        router.push('/settings?tab=subscription')
    }, [router])

    const handleLearnMore = useCallback(() => {
        // TODO: Replace with actual external link
        window.open('https://doma.ai/features', '_blank')
    }, [])

    if (isBlocked) {
        return (
            <>
                <Head>
                    <title>{pageTitle}</title>
                </Head>
                <PageWrapper>
                    <PageHeader title={<Typography.Title>{pageTitle}</Typography.Title>} />
                    <div className={styles['blocked-container']}>
                        <div className={styles['blocked-content-wrapper']}>
                            <Space
                                direction='vertical'
                                align='center'
                                size={24}
                            >
                                <img
                                    src='/dino/searching.png'
                                    alt='Access denied'
                                />

                                <Space size={16} direction='vertical'>
                                    <Title level={2}>
                                        {intl.formatMessage({
                                            id: 'subscription.accessGuard.title',
                                        })}
                                    </Title>

                                    <Paragraph>
                                        {intl.formatMessage({
                                            id: 'subscription.accessGuard.description',
                                        })}
                                    </Paragraph>
                                </Space>

                                <Space size={16} direction='vertical'>
                                    <Button type='primary' onClick={handleGoToPlans}>
                                        {intl.formatMessage({
                                            id: 'subscription.accessGuard.goToPlans',
                                        })}
                                    </Button>
                                    <Button type='secondary' onClick={handleLearnMore}>
                                        {intl.formatMessage({
                                            id: 'subscription.accessGuard.learnMore',
                                        })}
                                    </Button>
                                </Space>
                            </Space>
                        </div>
                    </div>
                </PageWrapper>
            </>
        )
    }

    return <>{children}</>
}

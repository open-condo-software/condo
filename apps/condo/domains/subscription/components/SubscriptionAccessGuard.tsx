import { useGetB2BAppQuery } from '@app/condo/gql'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Space } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'

import styles from './SubscriptionAccessGuard.module.css'
import { SubscriptionTrialEndedModal } from './SubscriptionTrialEndedModal'
import { SubscriptionWelcomeModal } from './SubscriptionWelcomeModal'

import { PageHeader, PageWrapper } from '../../common/components/containers/BaseLayout'
import { requiresSubscriptionAccess, getRequiredFeature, isMiniappPage, getMiniappId } from '../constants/routeFeatureMapping'
import { useOrganizationSubscription } from '../hooks'

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
    const { isFeatureAvailable, isB2BAppEnabled, hasSubscription, loading } = useOrganizationSubscription()

    // Check if this is a miniapp page and get its ID
    const isMiniapp = isMiniappPage(router.pathname)
    const miniappId = isMiniapp ? getMiniappId(router.query) : null

    // Fetch B2BApp data if on miniapp page
    const { data: b2bAppData, loading: b2bAppLoading } = useGetB2BAppQuery({
        variables: { id: miniappId || '' },
        skip: !miniappId,
    })

    const b2bApp = b2bAppData?.b2bApp

    const pageTitle = useMemo(() => {
        // Use B2BApp name for miniapp pages
        if (isMiniapp && b2bApp?.name) {
            return b2bApp.name
        }
        return getPageTitle(router.pathname, intl)
    }, [router.pathname, intl, isMiniapp, b2bApp])

    const isBlocked = useMemo(() => {
        const currentPath = router.pathname

        // Check if route requires subscription access
        if (!requiresSubscriptionAccess(currentPath)) {
            return false
        }

        // Check subscription status
        if (loading || !hasSubscription) {
            return true
        }

        // Check miniapp access (if on miniapp page)
        if (isMiniapp && miniappId) {
            if (b2bAppLoading) {
                return true
            }
            if (!isB2BAppEnabled(miniappId)) {
                return true
            }
        }

        // Check feature access
        const requiredFeature = getRequiredFeature(currentPath)
        if (requiredFeature && !isFeatureAvailable(requiredFeature)) {
            return true
        }

        return false
    }, [router.pathname, loading, hasSubscription, isFeatureAvailable, isMiniapp, miniappId, b2bAppLoading, isB2BAppEnabled])

    const handleGoToPlans = useCallback(() => {
        router.push('/settings?tab=subscription')
    }, [router])

    const handleLearnMore = useCallback(() => {
        // TODO: Replace with actual external link
        window.open('https://doma.ai/features', '_blank')
    }, [])

    if (loading || (isMiniapp && b2bAppLoading)) {
        return <Loader />
    }

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

    return (
        <>
            <SubscriptionWelcomeModal />
            <SubscriptionTrialEndedModal />
            {children}
        </>
    )
}

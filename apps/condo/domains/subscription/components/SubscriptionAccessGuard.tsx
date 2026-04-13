import { useGetB2BAppQuery } from '@app/condo/gql'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { Typography, Button, Space } from '@open-condo/ui'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { SUBSCRIPTIONS } from '@condo/domains/common/constants/featureflags'
import { SETTINGS_TAB_SUBSCRIPTION } from '@condo/domains/common/constants/settingsTabs'

import styles from './SubscriptionAccessGuard.module.css'
import { SubscriptionTrialEndedModal } from './SubscriptionTrialEndedModal'
import { SubscriptionWelcomeModal } from './SubscriptionWelcomeModal'

import { requiresSubscriptionAccess, getRequiredFeature, isMiniappPage, getMiniappId } from '../constants/routeFeatureMapping'
import { useFeatureSubscription, useOrganizationSubscription } from '../hooks'

import type { AvailableFeatureType } from '../constants/features'


const { publicRuntimeConfig: { subscriptionFeatureHelpLinks = {}, enableSubscriptions } } = getConfig()

interface SubscriptionAccessGuardProps {
    children: React.ReactNode
    skipGuard?: boolean
}

/**
 * Get page title based on current route
 */
const getPageTitle = (pathname: string, intl: any): string => {
    const routeTitleMap: Record<string, string> = {
        '/tour': intl.formatMessage({ id: 'global.section.tour' }),
        '/reports': intl.formatMessage({ id: 'global.section.analytics' }),
        '/ticket': intl.formatMessage({ id: 'global.section.controlRoom' }),
        '/incident': intl.formatMessage({ id: 'global.section.incidents' }),
        '/news': intl.formatMessage({ id: 'global.section.newsItems' }),
        '/property': intl.formatMessage({ id: 'global.section.properties' }),
        '/contact': intl.formatMessage({ id: 'global.section.contacts' }),
        '/employee': intl.formatMessage({ id: 'global.section.employees' }),
        '/marketplace': intl.formatMessage({ id: 'global.section.marketplace' }),
        '/billing': intl.formatMessage({ id: 'global.section.accrualsAndPayments' }),
        '/service-provider-profile': intl.formatMessage({ id: 'global.section.SPP' }),
        '/meter': intl.formatMessage({ id: 'global.section.meters' }),
        '/miniapps': intl.formatMessage({ id: 'global.section.miniapps' }),
        '/settings': intl.formatMessage({ id: 'global.section.settings' }),
    }

    if (routeTitleMap[pathname]) {
        return routeTitleMap[pathname]
    }

    for (const route in routeTitleMap) {
        if (pathname.startsWith(route + '/')) {
            return routeTitleMap[route]
        }
    }

    return intl.formatMessage({ id: 'subscription.accessGuard.defaultPageTitle' })
}

/**
 * Guard component that checks subscription access for protected routes
 * Blocks content completely and shows access denied screen
 */
export const SubscriptionAccessGuard: React.FC<SubscriptionAccessGuardProps> = ({ children, skipGuard = false }) => {
    const router = useRouter()
    const intl = useIntl()
    const GuardTitle = intl.formatMessage({ id: 'subscription.accessGuard.title' })
    const GuardDescription = intl.formatMessage({ id: 'subscription.accessGuard.description' })
    const GoToPlansMessage = intl.formatMessage({ id: 'subscription.accessGuard.goToPlans' })
    const LearnMoreMessage = intl.formatMessage({ id: 'subscription.accessGuard.learnMore' })
    const FeatureGuardTitle = intl.formatMessage({ id: 'subscription.accessGuard.feature.title' })
    const FeaturePayButton = intl.formatMessage({ id: 'subscription.accessGuard.feature.payButton' })
    const AwaitingPaymentMessage = intl.formatMessage({ id: 'subscription.planCard.requestPending' })
    const { useFlag } = useFeatureFlags()
    const hasSubscriptionsFlag = useFlag(SUBSCRIPTIONS)
    const { isFeatureAvailable, isB2BAppEnabled, hasSubscription, loading } = useOrganizationSubscription()

    const isMiniapp = isMiniappPage(router.pathname)
    const miniappId = isMiniapp ? getMiniappId(router.query) : null

    const featureName: AvailableFeatureType = isMiniapp
        ? 'b2bApp'
        : (getRequiredFeature(router.pathname) ?? 'b2bApp')
    const featureAppId = isMiniapp ? (miniappId ?? undefined) : undefined

    const {
        hasFeaturePlan,
        formattedFeaturePrice,
        forPlanLabel,
        promotedServicePlan,
        hasPendingFeatureRequest,
        openPaymentModal,
        PaymentModal,
        loading: featureLoading,
    } = useFeatureSubscription(featureName, featureAppId)
    const { data: b2bAppData, loading: b2bAppLoading } = useGetB2BAppQuery({
        variables: { id: miniappId || '' },
        skip: skipGuard || !miniappId || !enableSubscriptions || !hasSubscriptionsFlag,
    })
    const b2bApp = b2bAppData?.b2bApp?.[0]

    const pageTitle = useMemo(() => {
        if (isMiniapp && b2bApp?.name) {
            return b2bApp.name
        }
        return getPageTitle(router.pathname, intl)
    }, [router.pathname, intl, isMiniapp, b2bApp])

    const currentFeature = useMemo(() => {
        return getRequiredFeature(router.pathname)
    }, [router.pathname])

    const helpLinkKey = useMemo(() => {
        if (isMiniapp && miniappId) {
            return miniappId
        }
        return currentFeature
    }, [isMiniapp, miniappId, currentFeature])

    const helpLink = useMemo(() => subscriptionFeatureHelpLinks[helpLinkKey], [helpLinkKey])

    const isBlocked = useMemo(() => {
        if (skipGuard) {
            return false
        }
        
        const currentPath = router.pathname
        if (!requiresSubscriptionAccess(currentPath)) {
            return false
        }

        if (!enableSubscriptions || !hasSubscriptionsFlag) {
            return false
        }

        if (loading || !hasSubscription) {
            return true
        }

        if (featureLoading || (isMiniapp && b2bAppLoading)) {
            return true
        }

        if (isMiniapp && miniappId && !isB2BAppEnabled(miniappId)) {
            return true
        }

        const requiredFeature = getRequiredFeature(currentPath)
        if (requiredFeature && !isFeatureAvailable(requiredFeature)) {
            return true
        }

        return false
    }, [skipGuard, router.pathname, loading, hasSubscription, isFeatureAvailable, isMiniapp, miniappId, b2bAppLoading, featureLoading, isB2BAppEnabled, hasSubscriptionsFlag])

    const handleGoToPlans = useCallback(() => {
        router.push('/settings?tab=subscription')
    }, [router])

    const handleLearnMore = useCallback(() => {
        if (helpLink) {
            window.open(helpLink, '_blank')
        }
    }, [helpLink])

    if (!skipGuard && (loading || (isMiniapp && b2bAppLoading) || featureLoading)) {
        return <Loader />
    }

    if (skipGuard) {
        return <>{children}</>
    }

    const settingsUrl = `/settings?tab=${SETTINGS_TAB_SUBSCRIPTION}`
    const FreeWithPlanNode = promotedServicePlan
        ? intl.formatMessage(
            { id: 'subscription.accessGuard.feature.freeWithPlan' },
            { planName: <Typography.Link href={settingsUrl}>{promotedServicePlan.name}</Typography.Link> }
        )
        : null

    if (isBlocked) {
        return (
            <>
                {PaymentModal}
                <SubscriptionTrialEndedModal />
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
                                    <Typography.Title level={3}>
                                        {hasFeaturePlan ? FeatureGuardTitle : GuardTitle}
                                    </Typography.Title>

                                    <Typography.Paragraph type='secondary'>
                                        {hasFeaturePlan ? (
                                            <>
                                                {formattedFeaturePrice && `${formattedFeaturePrice}${forPlanLabel ? ` ${forPlanLabel}` : ''}`}
                                                {FreeWithPlanNode && (
                                                    <>
                                                        {formattedFeaturePrice && ', '}
                                                        {FreeWithPlanNode}
                                                    </>
                                                )}
                                            </>
                                        ) : GuardDescription}
                                    </Typography.Paragraph>
                                </Space>

                                <Space size={16} direction='vertical' align='center'>
                                    {hasFeaturePlan ? (
                                        <Button type='primary' disabled={hasPendingFeatureRequest} onClick={openPaymentModal}>
                                            {hasPendingFeatureRequest ? AwaitingPaymentMessage : FeaturePayButton}
                                        </Button>
                                    ) : (
                                        <Button type='primary' onClick={handleGoToPlans}>
                                            {GoToPlansMessage}
                                        </Button>
                                    )}
                                    {helpLink && (
                                        <Button type='secondary' onClick={handleLearnMore}>
                                            {LearnMoreMessage}
                                        </Button>
                                    )}
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

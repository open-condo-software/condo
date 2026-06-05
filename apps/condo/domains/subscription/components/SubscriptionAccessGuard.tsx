import { useGetB2BAppQuery } from '@app/condo/gql'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useMemo, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Button, Tooltip } from '@open-condo/ui'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { Loader } from '@condo/domains/common/components/Loader'
import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'
import { SETTINGS_TAB_SUBSCRIPTION } from '@condo/domains/common/constants/settingsTabs'

import { SubscriptionBlockedContent } from './SubscriptionBlockedContent'
import { SubscriptionTrialEndedModal } from './SubscriptionTrialEndedModal'
import { SubscriptionWelcomeModal } from './SubscriptionWelcomeModal'

import { requiresSubscriptionAccess, getRequiredFeature, isMiniappPage, getMiniappId } from '../constants/routeFeatureMapping'
import { useFeatureSubscription, useOrganizationSubscription, useActivateSubscriptions } from '../hooks'
import { useSubscriptionPaymentModal } from '../hooks/useSubscriptionPaymentModal'

import type { AvailableFeatureType } from '../constants/features'


const { publicRuntimeConfig: { subscriptionFeatureHelpLinks = {} } } = getConfig()

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
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const GuardTitle = intl.formatMessage({ id: 'subscription.accessGuard.title' })
    const GuardDescription = intl.formatMessage({ id: 'subscription.accessGuard.description' })
    const GoToPlansMessage = intl.formatMessage({ id: 'subscription.accessGuard.goToPlans' })
    const LearnMoreMessage = intl.formatMessage({ id: 'subscription.accessGuard.learnMore' })
    const FeatureGuardTitle = intl.formatMessage({ id: 'subscription.accessGuard.feature.title' })
    const FeaturePayButton = intl.formatMessage({ id: 'subscription.accessGuard.feature.payButton' })
    const AwaitingPaymentMessage = intl.formatMessage({ id: 'subscription.planCard.requestPending' })
    const AwaitingPaymentTooltipMessage = intl.formatMessage({ id: 'subscription.planCard.requestPending.tooltip' })
    const UnavailableTitle = intl.formatMessage({ id: 'subscription.accessGuard.unavailable.title' }, { defaultMessage: 'Access denied' })
    const UnavailableDescription = intl.formatMessage({ id: 'subscription.accessGuard.unavailable.description' }, { defaultMessage: 'You do not have access to this service' })
    const { isFeatureAvailable, isB2BAppEnabled, hasSubscription, loading, hasSubscriptionsFeature } = useOrganizationSubscription()
    const { organization, isLoading: orgIsLoading } = useOrganization()
    const { isLoading: authIsLoading } = useAuth()

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
        featurePlanId,
        registerFeatureSubscription,
        loading: featureLoading,
    } = useFeatureSubscription(featureName, featureAppId)
    const { activateLoading, pendingRequests } = useActivateSubscriptions()
    const hasPendingFeatureRequest = pendingRequests.some(
        req => req.subscriptionPlanPricingRule?.subscriptionPlan?.id === featurePlanId
    )
    const { PaymentModal, openModal: openPaymentModal } = useSubscriptionPaymentModal({
        registerSubscriptionContext: registerFeatureSubscription,
        activateLoading,
    })
    const { data: b2bAppData, loading: b2bAppLoading } = useGetB2BAppQuery({
        variables: { id: miniappId || '' },
        skip: skipGuard || !miniappId || !hasSubscriptionsFeature,
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

        if (!hasSubscriptionsFeature) {
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
    }, [skipGuard, router.pathname, loading, hasSubscription, isFeatureAvailable, isMiniapp, miniappId, b2bAppLoading, featureLoading, isB2BAppEnabled, hasSubscriptionsFeature])

    const handleGoToPlans = useCallback(() => {
        router.push('/settings?tab=subscription')
    }, [router])

    const handleLearnMore = useCallback(() => {
        if (helpLink) {
            window.open(helpLink, '_blank')
        }
    }, [helpLink])

    const pageRequiresSubscription = !skipGuard && requiresSubscriptionAccess(router.pathname)
    const isLoading = authIsLoading || orgIsLoading || loading || featureLoading || (isMiniapp && b2bAppLoading)
    const isOrgDataPending = pageRequiresSubscription && (isLoading || !organization)

    if (!skipGuard && isOrgDataPending) {
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
        if (hidePaidFeatures && !hasSubscription) {
            return (
                <>
                    <Head>
                        <title>{pageTitle}</title>
                    </Head>
                    <PageWrapper>
                        <PageHeader title={<Typography.Title>{pageTitle}</Typography.Title>} />
                        <SubscriptionBlockedContent
                            title={UnavailableTitle}
                            description={UnavailableDescription}
                            primaryButton={null}
                        />
                    </PageWrapper>
                </>
            )
        }

        let primaryButton: React.ReactNode
        if (!hasFeaturePlan) {
            primaryButton = <Button id='subscription-access-guard-go-to-plans-button' type='primary' onClick={handleGoToPlans}>{GoToPlansMessage}</Button>
        } else if (hasPendingFeatureRequest) {
            primaryButton = (
                <Tooltip title={AwaitingPaymentTooltipMessage}>
                    <span>
                        <Button type='primary' disabled>{AwaitingPaymentMessage}</Button>
                    </span>
                </Tooltip>
            )
        } else {
            primaryButton = <Button id='subscription-access-guard-buy-feature-button' type='primary' onClick={openPaymentModal}>{FeaturePayButton}</Button>
        }

        const featureDescription = (
            <>
                {formattedFeaturePrice && `${formattedFeaturePrice}${forPlanLabel ? ` ${forPlanLabel}` : ''}`}
                {FreeWithPlanNode && (
                    <>
                        {formattedFeaturePrice && ', '}
                        {FreeWithPlanNode}
                    </>
                )}
            </>
        )

        return (
            <>
                {!hidePaidFeatures && PaymentModal}
                {!hidePaidFeatures && <SubscriptionTrialEndedModal />}
                <Head>
                    <title>{pageTitle}</title>
                </Head>
                <PageWrapper>
                    <PageHeader title={<Typography.Title>{pageTitle}</Typography.Title>} />
                    <SubscriptionBlockedContent
                        title={hasFeaturePlan ? FeatureGuardTitle : GuardTitle}
                        description={hasFeaturePlan ? featureDescription : GuardDescription}
                        primaryButton={primaryButton}
                        secondaryButton={helpLink && (
                            <Button id='subscription-access-guard-learn-more-button' type='secondary' onClick={handleLearnMore}>{LearnMoreMessage}</Button>
                        )}
                    />
                </PageWrapper>
            </>
        )
    }

    return (
        <>
            {!hidePaidFeatures && <SubscriptionWelcomeModal />}
            {!hidePaidFeatures && <SubscriptionTrialEndedModal />}
            {children}
        </>
    )
}

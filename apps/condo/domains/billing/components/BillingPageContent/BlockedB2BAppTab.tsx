import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { Button, Tooltip, Typography } from '@open-condo/ui'

import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'
import { SETTINGS_TAB_SUBSCRIPTION } from '@condo/domains/common/constants/settingsTabs'
import { SubscriptionBlockedContent } from '@condo/domains/subscription/components'
import { useActivateSubscriptions } from '@condo/domains/subscription/hooks/useActivateSubscriptions'
import { useFeatureSubscription } from '@condo/domains/subscription/hooks/useFeatureSubscription'
import { useSubscriptionPaymentModal } from '@condo/domains/subscription/hooks/useSubscriptionPaymentModal'


const { publicRuntimeConfig: { subscriptionFeatureHelpLinks = {}, serverUrl } } = getConfig()

type BlockedB2BAppTabProps = {
    appId: string
    shortDescription?: string | null
}

export const BlockedB2BAppTab: React.FC<BlockedB2BAppTabProps> = ({ appId, shortDescription }) => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const GuardTitle = intl.formatMessage({ id: 'subscription.accessGuard.title' })
    const FeatureGuardTitle = intl.formatMessage({ id: 'subscription.accessGuard.feature.title' })
    const GoToPlansMessage = intl.formatMessage({ id: 'subscription.accessGuard.goToPlans' })
    const FeaturePayButton = intl.formatMessage({ id: 'subscription.accessGuard.feature.payButton' })
    const AwaitingPaymentMessage = intl.formatMessage({ id: 'subscription.planCard.requestPending' })
    const AwaitingPaymentTooltipMessage = intl.formatMessage({ id: 'subscription.planCard.requestPending.tooltip' })
    const LearnMoreMessage = intl.formatMessage({ id: 'subscription.accessGuard.learnMore' })
    const UnavailableTitle = intl.formatMessage({ id: 'subscription.accessGuard.unavailable.title' }, { defaultMessage: 'Access denied' })
    const UnavailableDescription = intl.formatMessage({ id: 'subscription.accessGuard.unavailable.description' }, { defaultMessage: 'You do not have access to this service' })

    const router = useRouter()

    const returnUrl = `${serverUrl}${router.asPath}`
    const helpLink = subscriptionFeatureHelpLinks[appId]

    const {
        hasFeaturePlan,
        formattedFeaturePrice,
        forPlanLabel,
        promotedServicePlan,
        featurePlanId,
        registerFeatureSubscription,
    } = useFeatureSubscription('b2bApp', appId, returnUrl)

    const { activateLoading, pendingRequests } = useActivateSubscriptions()

    const hasPendingFeatureRequest = pendingRequests.some(
        req => req.subscriptionPlanPricingRule?.subscriptionPlan?.id === featurePlanId
    )

    const { PaymentModal, openModal } = useSubscriptionPaymentModal({
        registerSubscriptionContext: registerFeatureSubscription,
        activateLoading,
    })

    const handleGoToPlans = useCallback(() => {
        router.push(`/settings?tab=${SETTINGS_TAB_SUBSCRIPTION}`)
    }, [router])

    const handleLearnMore = useCallback(() => {
        window.open(helpLink, '_blank')
    }, [helpLink])

    const settingsUrl = `/settings?tab=${SETTINGS_TAB_SUBSCRIPTION}`

    const FreeWithPlanNode = useMemo(() => promotedServicePlan
        ? intl.formatMessage(
            { id: 'subscription.accessGuard.feature.freeWithPlan' },
            { planName: <Typography.Link href={settingsUrl}>{promotedServicePlan.name}</Typography.Link> }
        )
        : null,
    [intl, promotedServicePlan, settingsUrl])

    const description = useMemo(() => (
        <>
            {shortDescription && `${shortDescription}. `}
            {formattedFeaturePrice && `${formattedFeaturePrice}${forPlanLabel ? ` ${forPlanLabel}` : ''}`}
            {FreeWithPlanNode && (
                <>
                    {formattedFeaturePrice && ', '}
                    {FreeWithPlanNode}
                </>
            )}
        </>
    ), [shortDescription, formattedFeaturePrice, forPlanLabel, FreeWithPlanNode])

    if (hidePaidFeatures) {
        return (
            <SubscriptionBlockedContent
                title={UnavailableTitle}
                description={UnavailableDescription}
                primaryButton={null}
            />
        )
    }

    let primaryButton: React.ReactNode
    if (!hasFeaturePlan) {
        primaryButton = <Button type='primary' onClick={handleGoToPlans}>{GoToPlansMessage}</Button>
    } else if (hasPendingFeatureRequest) {
        primaryButton = (
            <Tooltip title={AwaitingPaymentTooltipMessage}>
                <span>
                    <Button type='primary' disabled>{AwaitingPaymentMessage}</Button>
                </span>
            </Tooltip>
        )
    } else {
        primaryButton = <Button type='primary' onClick={openModal}>{FeaturePayButton}</Button>
    }

    return (
        <>
            {PaymentModal}
            <SubscriptionBlockedContent
                title={hasFeaturePlan ? FeatureGuardTitle : GuardTitle}
                description={description}
                primaryButton={primaryButton}
                secondaryButton={helpLink && (
                    <Button type='secondary' onClick={handleLearnMore}>{LearnMoreMessage}</Button>
                )}
            />
        </>
    )
}

import { useGetAvailableSubscriptionPlansQuery } from '@app/condo/gql'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space, Tooltip, Tour, Typography } from '@open-condo/ui'

import { CURRENCY_SYMBOLS } from '@condo/domains/common/constants/currencies'
import { SETTINGS_TAB_SUBSCRIPTION } from '@condo/domains/common/constants/settingsTabs'
import { TrialActivatedTooltip } from '@condo/domains/subscription/components/TrialActivatedTooltip'
import { getRequiredFeature } from '@condo/domains/subscription/constants/routeFeatureMapping'
import { useActivateSubscriptions, useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import type { AvailableFeature } from '@condo/domains/subscription/constants/features'

const TRIAL_POPUP_PLAN_KEY = 'active_trial_popup_plan'
const TRIAL_POPUP_INSTANCE_KEY = 'active_trial_popup_instance'

export interface NoSubscriptionTooltipProps {
    children: React.ReactElement
    placement?: 'top' | 'bottom' | 'left' | 'right'
    feature?: AvailableFeature | AvailableFeature[]
    id?: string
    path?: string
    getPopupContainer?: () => HTMLElement
    skipTooltip?: boolean
}

export const NoSubscriptionTooltip: React.FC<NoSubscriptionTooltipProps> = ({ children, placement = 'right', feature: featureProp, path, getPopupContainer, id, skipTooltip }) => {
    const intl = useIntl()
    const router = useRouter()
    const { organization } = useOrganization()
    const { trialSubscriptions, activatedSubscriptions, handleActivatePlan, activateLoading } = useActivateSubscriptions()
    const { isFeatureAvailable, hasSubscription } = useOrganizationSubscription()
    const [isActivating, setIsActivating] = useState(false)
    const [recentlyActivatedTrialPlan, setRecentlyActivatedTrialPlan] = useState<string | null>(null)
    
    useEffect(() => {
        if (!id) return
        
        const storedPlan = sessionStorage.getItem(TRIAL_POPUP_PLAN_KEY)
        const storedInstance = sessionStorage.getItem(TRIAL_POPUP_INSTANCE_KEY)
        
        if (storedPlan && storedInstance === id) {
            setRecentlyActivatedTrialPlan(storedPlan)
        }
    }, [id])

    const requiredFeature = path ? getRequiredFeature(path) : null
    const feature = (featureProp || requiredFeature) as AvailableFeature | undefined | null

    const FeatureLockedMessage = intl.formatMessage({ 
        id: 'subscription.warns.noActiveSubscription',
    })
    const UpgradePlanMessage = intl.formatMessage({
        id: 'subscription.warns.upgradePlan',
    })
    const ViewPlansButton = intl.formatMessage({
        id: 'subscription.warns.activateSubscriptionButton',
    })

    const { data: plansData } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id,
    })

    const hasActivatedAnyTrial = trialSubscriptions.length > 0
    const isAvailable = feature 
        ? Array.isArray(feature)
            ? feature.every(f => isFeatureAvailable(f))
            : isFeatureAvailable(feature)
        : false

    const bestPlanWithFeature = useMemo(() => {
        if (!feature || isAvailable) return null
        
        const plans = plansData?.result?.plans || []
        
        const plansWithFeature = plans
            .filter(planInfo => {
                const plan = planInfo?.plan
                if (!plan) return false
                
                const hasFeature = Array.isArray(feature)
                    ? feature.every(f => plan[f] === true)
                    : plan[feature] === true
                const hasTrialDays = plan.trialDays > 0
                const prices = planInfo?.prices || []
                const hasPrice = prices.length > 0
                
                const alreadyActivated = activatedSubscriptions.some(
                    ctx => ctx.subscriptionPlan && (
                        ctx.subscriptionPlan.id === plan.id ||
                        ctx.subscriptionPlan.priority > (plan.priority || 0)
                    )
                )

                return hasFeature && hasTrialDays && hasPrice && !alreadyActivated
            })
            .sort((a, b) => (b.plan?.priority ?? 0) - (a.plan?.priority ?? 0))
        
        return plansWithFeature[0] || null
    }, [feature, isAvailable, plansData?.result?.plans, activatedSubscriptions])

    const TryTrialButton = useMemo(() => {
        const currencyCode = bestPlanWithFeature?.prices?.[0]?.currencyCode
        return intl.formatMessage({
            id: 'subscription.warns.tryTrialButton',
        }, { currency: CURRENCY_SYMBOLS[currencyCode] || '' })
    }, [bestPlanWithFeature, intl])

    const handleActivateTrial = useCallback(async () => {
        if (!bestPlanWithFeature) {
            await router.push(`/settings?tab=${SETTINGS_TAB_SUBSCRIPTION}`)
            return
        }

        const price = bestPlanWithFeature.prices?.[0]
        if (!price?.id) return

        setIsActivating(true)
        try {
            const planName = bestPlanWithFeature.plan?.name || ''

            await handleActivatePlan({
                priceId: price.id,
                isTrial: true,
                planName,
                trialDays: bestPlanWithFeature.plan?.trialDays || 0,
                isCustomPrice: false,
            })

            if (id) {
                sessionStorage.setItem(TRIAL_POPUP_PLAN_KEY, planName)
                sessionStorage.setItem(TRIAL_POPUP_INSTANCE_KEY, id)
            }
            setRecentlyActivatedTrialPlan(planName)
        } finally {
            setIsActivating(false)
        }
    }, [bestPlanWithFeature, handleActivatePlan, router, id])

    const handleViewPlans = useCallback(async () => {
        await router.push(`/settings?tab=${SETTINGS_TAB_SUBSCRIPTION}`)
    }, [router])

    const isLoading = activateLoading || isActivating

    const buttonText = hasActivatedAnyTrial ? ViewPlansButton : TryTrialButton
    
    const buttonAction = !feature || hasActivatedAnyTrial ? handleViewPlans : handleActivateTrial

    const tooltipTitle = (
        <Space size={12} direction='vertical'>
            <Typography.Text size='small'>{hasActivatedAnyTrial ? UpgradePlanMessage : FeatureLockedMessage}</Typography.Text>
            <Button 
                type='accent' 
                size='medium'
                block
                onClick={buttonAction}
                loading={isLoading}
                disabled={isLoading}
            >
                {buttonText}
            </Button>
        </Space>
    )

    const handleClearRecentlyActivatedTrial = useCallback(() => {
        sessionStorage.removeItem(TRIAL_POPUP_PLAN_KEY)
        sessionStorage.removeItem(TRIAL_POPUP_INSTANCE_KEY)
        setRecentlyActivatedTrialPlan(null)
    }, [])

    if (skipTooltip) {
        return children
    }

    if (path && !requiredFeature) {
        return children
    }

    if (path && !hasSubscription) {
        return children
    }

    if (recentlyActivatedTrialPlan) {
        return (
            <Tour.Provider>
                <TrialActivatedTooltip
                    planName={recentlyActivatedTrialPlan}
                    placement={placement}
                    onClose={handleClearRecentlyActivatedTrial}
                    getPopupContainer={getPopupContainer}
                >
                    {children}
                </TrialActivatedTooltip>
            </Tour.Provider>
        )
    }

    if (isAvailable) {
        return children
    }

    return (
        <Tooltip
            title={tooltipTitle}
            placement={placement}
            zIndex={1110}
        >
            {children}
        </Tooltip>
    )
}

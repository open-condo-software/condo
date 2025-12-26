import { useGetAvailableSubscriptionPlansQuery } from '@app/condo/gql'
import getConfig from 'next/config'
import { useMemo, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useOrganization } from '@open-condo/next/organization'

import { SUBSCRIPTION_BYPASS } from '@condo/domains/common/constants/featureFlags'

export type AvailableFeature = 'payments' | 'meters' | 'tickets' | 'news' | 'marketplace' | 'support' | 'ai' | 'customization'


const { publicRuntimeConfig: { enableSubscriptions } } = getConfig()

interface SubscriptionFeatures {
    payments: boolean
    meters: boolean
    tickets: boolean
    news: boolean
    marketplace: boolean
    support: boolean
    ai: boolean
    customization: boolean
    enabledB2BApps: string[]
    enabledB2CApps: string[]
    daysRemaining: number | null
    planName: string | null
    planId: string | null
    priority: number | null
    isTrial: boolean | null
    canBePromoted: boolean | null
    startAt: string | null
    endAt: string | null
}

interface SubscriptionPlan {
    id: string
    name: string
    trialDays?: number
    priority?: number
    canBePromoted?: boolean
}

export interface SubscriptionContext {
    subscriptionPlan: SubscriptionPlan | null
    isTrial: boolean | null
    startAt: string | null
    endAt: string | null
    daysRemaining: number | null
}

/**
 * Hook to get subscription features and context for the current organization.
 */
export const useOrganizationSubscription = () => {
    const { organization, isLoading: orgLoading } = useOrganization()
    const subscriptionFeatures = useMemo<SubscriptionFeatures | null>(() => {
        if (!organization?.subscription) return null
        return organization.subscription as SubscriptionFeatures
    }, [organization])

    const { data: allPlansData } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id || '' },
        },
        skip: !organization?.id,
    })

    const { useFlag } = useFeatureFlags()
    const hasSubscriptionByPass = useFlag(SUBSCRIPTION_BYPASS)

    const subscriptionContext = useMemo<SubscriptionContext | null>(() => {
        if (!subscriptionFeatures) return null
        
        return {
            subscriptionPlan: subscriptionFeatures.planId ? {
                id: subscriptionFeatures.planId,
                name: subscriptionFeatures.planName,
                priority: subscriptionFeatures.priority,
                canBePromoted: subscriptionFeatures.canBePromoted,
            } : null,
            isTrial: subscriptionFeatures.isTrial,
            startAt: subscriptionFeatures.startAt,
            endAt: subscriptionFeatures.endAt,
            daysRemaining: subscriptionFeatures.daysRemaining,
        }
    }, [subscriptionFeatures])

    const isFeatureAvailable = useCallback((feature: AvailableFeature): boolean => {
        if (!enableSubscriptions || hasSubscriptionByPass) return true
        if (!subscriptionFeatures) return false
        return subscriptionFeatures[feature] === true
    }, [subscriptionFeatures, hasSubscriptionByPass])

    const allEnabledB2BApps = useMemo(() => {
        const plans = allPlansData?.result?.plans || []
        const appsSet = new Set<string>()
        plans.forEach(planInfo => {
            const enabledApps = planInfo?.plan?.enabledB2BApps || []
            enabledApps.forEach(appId => appsSet.add(appId))
        })
        return appsSet
    }, [allPlansData])

    const isB2BAppEnabled = useCallback((appId: string): boolean => {
        if (!enableSubscriptions || hasSubscriptionByPass) return true
        if (!subscriptionFeatures) return false
        if (!allEnabledB2BApps.has(appId)) return false
        
        const currentEnabledApps = subscriptionFeatures.enabledB2BApps || []
        return currentEnabledApps.includes(appId)
    }, [subscriptionFeatures, allEnabledB2BApps, hasSubscriptionByPass])

    return {
        hasSubscription: !!subscriptionFeatures,
        isFeatureAvailable,
        isB2BAppEnabled,
        subscriptionContext,
        loading: orgLoading,
    }
}

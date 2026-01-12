import { useGetAvailableSubscriptionPlansQuery } from '@app/condo/gql'
import getConfig from 'next/config'
import { useMemo, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useOrganization } from '@open-condo/next/organization'

import { SUBSCRIPTIONS } from '@condo/domains/common/constants/featureflags'

import type { OrganizationSubscriptionFeatures } from '@app/condo/schema'
import type { AvailableFeature } from '@condo/domains/subscription/constants/features'


const { publicRuntimeConfig: { enableSubscriptions } } = getConfig()

type SubscriptionFeatures = OrganizationSubscriptionFeatures

type SubscriptionPlan = {
    id: string
    name: SubscriptionFeatures['planName']
    priority: SubscriptionFeatures['priority']
    canBePromoted: SubscriptionFeatures['canBePromoted']
}

export type SubscriptionContext = {
    subscriptionPlan: SubscriptionPlan | null
    isTrial: SubscriptionFeatures['isTrial']
    startAt: SubscriptionFeatures['startAt']
    endAt: SubscriptionFeatures['endAt']
    daysRemaining: SubscriptionFeatures['daysRemaining']
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

    const normalizedDaysRemaining = useMemo<SubscriptionFeatures['daysRemaining']>(() => {
        const value = subscriptionFeatures?.daysRemaining
        if (value === null || value === undefined) return value

        const numberValue = typeof value === 'number' ? value : Number(value)
        if (!Number.isFinite(numberValue)) return null

        return Math.trunc(numberValue)
    }, [subscriptionFeatures?.daysRemaining])

    const { data: allPlansData, loading: plansLoading } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id || '' },
        },
        skip: !organization?.id,
    })
    const hasAvailablePlans = useMemo(() => (allPlansData?.result?.plans || []).length > 0, [allPlansData?.result?.plans])

    const { useFlag } = useFeatureFlags()
    const hasSubscriptionsFlag = useFlag(SUBSCRIPTIONS)

    const subscriptionContext = useMemo<SubscriptionContext | null>(() => {
        if (!subscriptionFeatures || !enableSubscriptions || !hasSubscriptionsFlag) return null
        
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
            daysRemaining: normalizedDaysRemaining,
        }
    }, [subscriptionFeatures, hasSubscriptionsFlag, normalizedDaysRemaining])

    const isFeatureAvailable = useCallback((feature: AvailableFeature): boolean => {
        if (!enableSubscriptions || !hasSubscriptionsFlag) return true
        if (!subscriptionFeatures) return false
        return subscriptionFeatures[feature] === true
    }, [subscriptionFeatures, hasSubscriptionsFlag])

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
        if (!enableSubscriptions || !hasSubscriptionsFlag) return true
        if (!subscriptionFeatures) return false
        if (!allEnabledB2BApps.has(appId)) return true
        
        const currentEnabledApps = subscriptionFeatures.enabledB2BApps || []
        return currentEnabledApps.includes(appId)
    }, [subscriptionFeatures, allEnabledB2BApps, hasSubscriptionsFlag])

    return {
        hasSubscription: !!subscriptionFeatures,
        isFeatureAvailable,
        isB2BAppEnabled,
        subscriptionContext,
        loading: orgLoading || plansLoading,
        hasAvailablePlans,
    }
}

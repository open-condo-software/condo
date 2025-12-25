import { useApolloClient } from '@apollo/client'
import { useGetAvailableSubscriptionPlansQuery } from '@app/condo/gql'
import { useMemo, useCallback } from 'react'

import { useOrganization } from '@open-condo/next/organization'

export type AvailableFeature = 'payments' | 'meters' | 'tickets' | 'news' | 'marketplace' | 'support' | 'ai' | 'customization'

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
    isTrial: boolean | null
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
    const apolloClient = useApolloClient()
    const { organization, isLoading: orgLoading } = useOrganization()
    const subscriptionFeatures = useMemo<SubscriptionFeatures | null>(() => {
        if (!organization?.subscription) return null
        return organization.subscription as SubscriptionFeatures
    }, [organization])

    // Fetch all available plans for this organization to determine which apps are available
    const { data: allPlansData } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id || '' },
        },
        skip: !organization?.id,
    })

    const subscriptionContext = useMemo<SubscriptionContext | null>(() => {
        if (!subscriptionFeatures) return null
        
        return {
            subscriptionPlan: subscriptionFeatures.planId && subscriptionFeatures.planName ? {
                id: subscriptionFeatures.planId,
                name: subscriptionFeatures.planName,
            } : null,
            isTrial: subscriptionFeatures.isTrial,
            startAt: subscriptionFeatures.startAt,
            endAt: subscriptionFeatures.endAt,
            daysRemaining: subscriptionFeatures.daysRemaining,
        }
    }, [subscriptionFeatures])

    const isFeatureAvailable = useCallback((feature: AvailableFeature): boolean => {
        if (!subscriptionFeatures) return false
        return subscriptionFeatures[feature] === true
    }, [subscriptionFeatures])

    // Compute which apps are enabled in ANY plan for this organization type
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
        if (!subscriptionFeatures) return false
        
        // If app is not enabled in any plan for this org type, it's not available at all
        if (!allEnabledB2BApps.has(appId)) return false
        
        // If app is enabled in some plan, check if it's enabled in current subscription
        const currentEnabledApps = subscriptionFeatures.enabledB2BApps || []
        return currentEnabledApps.includes(appId)
    }, [subscriptionFeatures, allEnabledB2BApps])

    return {
        hasSubscription: !!subscriptionFeatures,
        isFeatureAvailable,
        isB2BAppEnabled,
        subscriptionContext,
        loading: orgLoading,
    }
}

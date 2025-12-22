import { useMemo, useCallback } from 'react'

import { useOrganization } from '@open-condo/next/organization'

export type AvailableFeature = 'news' | 'marketplace' | 'support' | 'ai'

interface SubscriptionPlan {
    id: string
    name: string
    news?: boolean
    marketplace?: boolean
    support?: boolean
    ai?: boolean
    disabledB2BApps?: string[]
    disabledB2CApps?: string[]
    trialDays?: number
    priority?: number
    canBePromoted?: boolean
}

interface Subscription {
    id: string
    subscriptionPlan: SubscriptionPlan | null
    startAt: string
    endAt: string | null
    isTrial: boolean
}

/**
 * Hook to get subscription from organization.subscription field
 * No additional GraphQL query needed - data comes from organization context
 */
export const useOrganizationSubscription = () => {
    const { organization, isLoading } = useOrganization()

    const subscription = useMemo<Subscription | null>(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const orgSubscription = (organization as any)?.subscription
        
        if (!orgSubscription) {
            return null
        }

        return orgSubscription
    }, [organization])

    const isExpired = useMemo(() => {
        if (!subscription || !subscription.endAt) return false
        return new Date(subscription.endAt) < new Date()
    }, [subscription])

    const isFeatureAvailable = useCallback((feature: AvailableFeature): boolean => {
        // If no subscription, block all features
        if (!subscription || isExpired) {
            return false
        }
        
        // Check if feature is available in subscription plan
        const plan = subscription.subscriptionPlan
        if (!plan) {
            return false
        }
        
        // Map feature keys to plan fields
        switch (feature) {
            case 'news':
                return plan.news === true
            case 'marketplace':
                return plan.marketplace === true
            case 'support':
                return plan.support === true
            case 'ai':
                return plan.ai === true
            default:
                // By default, features are available if not explicitly defined
                return true
        }
    }, [subscription, isExpired])
    
    const tariff = useMemo(() => {
        return subscription?.subscriptionPlan || null
    }, [subscription])

    const isB2BAppEnabled = useCallback((appId: string): boolean => {
        if (!subscription || isExpired) return false
        const plan = subscription.subscriptionPlan
        if (!plan) return false
        const disabledApps = plan.disabledB2BApps || []
        return !disabledApps.includes(appId)
    }, [subscription, isExpired])

    const isB2CAppEnabled = useCallback((appId: string): boolean => {
        if (!subscription || isExpired) return false
        const plan = subscription.subscriptionPlan
        if (!plan) return false
        const disabledApps = plan.disabledB2CApps || []
        return !disabledApps.includes(appId)
    }, [subscription, isExpired])
    
    return {
        isFeatureAvailable,
        isB2BAppEnabled,
        isB2CAppEnabled,
        isExpired,
        subscription,
        tariff,
        organization,
        loading: isLoading,
    }
}

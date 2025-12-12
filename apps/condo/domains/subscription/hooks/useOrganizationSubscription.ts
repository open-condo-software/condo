import { useMemo, useCallback } from 'react'

import { useOrganization } from '@open-condo/next/organization'

export type AvailableFeature = 'news' | 'marketplace' | 'support' | 'ai' | 'passTickets'

interface SubscriptionPlan {
    id: string
    name: string
    news?: boolean
    marketplace?: boolean
    support?: boolean
    ai?: boolean
    passTickets?: boolean
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

        return {
            id: orgSubscription.id,
            subscriptionPlan: orgSubscription.subscriptionPlan,
            startAt: orgSubscription.startAt,
            endAt: orgSubscription.endAt,
            isTrial: orgSubscription.isTrial,
        }
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
            case 'passTickets':
                return plan.passTickets === true
            default:
                // By default, features are available if not explicitly defined
                return true
        }
    }, [subscription, isExpired])
    
    const tariff = useMemo(() => {
        return subscription?.subscriptionPlan || null
    }, [subscription])
    
    return {
        isFeatureAvailable,
        isExpired,
        subscription,
        tariff,
        organization,
        loading: isLoading,
    }
}

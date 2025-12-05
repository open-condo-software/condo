import { useMemo, useCallback } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { GetActiveOrganizationEmployeeQuery, useGetSubscriptionContextQuery } from '../../../gql'

//export type Subscription = GetActiveOrganizationEmployeeQuery['employees'][number]['organization']
//export type SubscriptionPlan = Subscription['subscriptionPlan']
//export type AvailableFeature = keyof Pick<SubscriptionPlan, 'news' | 'marketplace' | 'support' | 'ai' | 'passTickets'>

/**
 * Hook to get subscription from organization
 * Returns subscription and tariff (subscriptionPlan) from organization.subscription field
 */
export const useOrganizationSubscription = () => {
    const { organization } = useOrganization()

    const { data, loading, refetch } = useGetSubscriptionContextQuery({
        variables: {
            id: organization?.subscription?.id,
        },
        skip: !organization?.subscription?.id,
    })

    const subscription = useMemo<any | null>(() => {
        // Prefer data from GraphQL query if available
        if (data?.subscriptionContext) {
            const context = data.subscriptionContext
            return {
                id: context.id,
                subscriptionPlan: context.subscriptionPlan,
                startAt: context.startAt,
                endAt: context.endAt,
                isTrial: context.isTrial,
                daysRemaining: context.daysRemaining,
                basePrice: context.basePrice,
                calculatedPrice: context.calculatedPrice,
                appliedRules: context.appliedRules,
            }
        }

        // Fallback to organization data while loading or if query is skipped
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
            daysRemaining: orgSubscription.daysRemaining,
        }
    }, [data, organization])

    const isExpired = useMemo(() => {
        return subscription ? subscription.daysRemaining <= 0 && !!subscription.endAt : false
    }, [subscription])

    const isFeatureAvailable = useCallback((feature: any): boolean => {
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
    
    return {
        isFeatureAvailable,
        isExpired,
        subscription,
        tariff,
        organization,
        loading,
        refetch,
    }
}

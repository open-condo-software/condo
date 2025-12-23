import { useGetActiveSubscriptionContextsQuery } from '@app/condo/gql'
import { useMemo, useCallback } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { selectBestSubscriptionContext } from '@condo/domains/subscription/utils/subscriptionContext'

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
    disabledB2BApps: string[]
    disabledB2CApps: string[]
}

interface SubscriptionPlan {
    id: string
    name: string
    trialDays?: number
    priority?: number
    canBePromoted?: boolean
}

export interface SubscriptionContext {
    id: string
    subscriptionPlan: SubscriptionPlan | null
    isTrial: boolean
    startAt: string
    endAt: string | null
    daysRemaining: number | null
}

/**
 * Hook to get subscription features and context for the current organization.
 */
export const useOrganizationSubscription = () => {
    const { organization, isLoading: orgLoading } = useOrganization()
    const subscriptionFeatures = useMemo<SubscriptionFeatures | null>(() => organization?.subscription, [organization])

    const now = useMemo(() => new Date().toISOString(), [])
    const { data, loading: contextsLoading, refetch: refetchSubscriptionContexts } = useGetActiveSubscriptionContextsQuery({
        variables: {
            organizationId: organization?.id || '',
            now,
        },
        skip: !organization?.id,
    })

    const activeContexts = useMemo(() => {
        return (data?.activeContexts || []) as SubscriptionContext[]
    }, [data])

    const subscriptionContext = useMemo(() => {
        return selectBestSubscriptionContext(activeContexts) as SubscriptionContext | null
    }, [activeContexts])

    const isFeatureAvailable = useCallback((feature: AvailableFeature): boolean => {
        if (!subscriptionFeatures) {
            return false
        }
        
        switch (feature) {
            case 'payments':
                return subscriptionFeatures.payments === true
            case 'meters':
                return subscriptionFeatures.meters === true
            case 'tickets':
                return subscriptionFeatures.tickets === true
            case 'news':
                return subscriptionFeatures.news === true
            case 'marketplace':
                return subscriptionFeatures.marketplace === true
            case 'support':
                return subscriptionFeatures.support === true
            case 'ai':
                return subscriptionFeatures.ai === true
            case 'customization':
                return subscriptionFeatures.customization === true
            default:
                return true
        }
    }, [subscriptionFeatures])

    const isB2BAppEnabled = useCallback((appId: string): boolean => {
        if (!subscriptionFeatures) return false
        const disabledApps = subscriptionFeatures.disabledB2BApps || []
        return !disabledApps.includes(appId)
    }, [subscriptionFeatures])

    return {
        hasSubscription: !!subscriptionFeatures,
        isFeatureAvailable,
        isB2BAppEnabled,
        subscriptionContext,
        loading: orgLoading || contextsLoading,
        refetchSubscriptionContexts,
    }
}

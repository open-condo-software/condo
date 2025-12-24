import { useApolloClient } from '@apollo/client'
import { useGetActiveSubscriptionContextsQuery, useGetAvailableSubscriptionPlansQuery } from '@app/condo/gql'
import dayjs from 'dayjs'
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
    enabledB2BApps: string[]
    enabledB2CApps: string[]
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
    const apolloClient = useApolloClient()
    const { organization, isLoading: orgLoading } = useOrganization()
    const subscriptionFeatures = useMemo<SubscriptionFeatures | null>(() => organization?.subscription, [organization])

    const now = useMemo(() => dayjs().endOf('day').toISOString(), [])
    const { data, loading: contextsLoading } = useGetActiveSubscriptionContextsQuery({
        variables: {
            organizationId: organization?.id || '',
            now,
        },
        skip: !organization?.id,
    })

    // Fetch all available plans for this organization to determine which apps are available
    const { data: allPlansData } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id || '' },
        },
        skip: !organization?.id,
    })

    const activeContexts = useMemo(() => {
        return (data?.activeContexts || []) as SubscriptionContext[]
    }, [data])

    const subscriptionContext = useMemo(() => {
        return selectBestSubscriptionContext(activeContexts) as SubscriptionContext | null
    }, [activeContexts])

    const refetchSubscriptionContexts = useCallback(async () => {
        apolloClient.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allSubscriptionContexts' })
        apolloClient.cache.gc()
    }, [apolloClient])

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
        loading: orgLoading || contextsLoading,
        refetchSubscriptionContexts,
    }
}

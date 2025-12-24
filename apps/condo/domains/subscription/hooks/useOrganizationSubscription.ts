import { useApolloClient } from '@apollo/client'
import { useGetActiveSubscriptionContextsQuery } from '@app/condo/gql'
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

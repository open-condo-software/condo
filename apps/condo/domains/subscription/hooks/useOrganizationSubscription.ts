import { useGetAvailableSubscriptionPlansQuery, useGetSubscriptionContextByIdQuery } from '@app/condo/gql'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import { useMemo, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useOrganization } from '@open-condo/next/organization'

import { SUBSCRIPTIONS } from '@condo/domains/common/constants/featureflags'

import type { GetSubscriptionContextByIdQuery } from '@app/condo/gql/operation.types'
import type { OrganizationSubscriptionFeatures } from '@app/condo/schema'
import type { AvailableFeature } from '@condo/domains/subscription/constants/features'


const { publicRuntimeConfig: { enableSubscriptions } } = getConfig()

type SubscriptionFeatures = OrganizationSubscriptionFeatures

export type SubscriptionContext = GetSubscriptionContextByIdQuery['subscriptionContext']

/**
 * Hook to get subscription features and context for the current organization.
 */
export const useOrganizationSubscription = () => {
    const { organization, isLoading: orgLoading } = useOrganization()
    const subscriptionFeatures = useMemo<SubscriptionFeatures>(() => {
        return organization?.subscription as SubscriptionFeatures
    }, [organization])

    const { data: allPlansData, loading: plansLoading } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id || '' },
        },
        skip: !organization?.id,
    })
    const hasAvailablePlans = useMemo(() => (allPlansData?.result?.plans || []).length > 0, [allPlansData?.result?.plans])

    const { useFlag } = useFeatureFlags()
    const hasSubscriptionsFlag = useFlag(SUBSCRIPTIONS)

    const { data: contextData, loading: contextLoading, refetch: refetchContext } = useGetSubscriptionContextByIdQuery({
        variables: {
            id: subscriptionFeatures?.activeSubscriptionContextId || '',
        },
        skip: !subscriptionFeatures?.activeSubscriptionContextId || !enableSubscriptions || !hasSubscriptionsFlag,
    })

    const subscriptionContext = useMemo<SubscriptionContext | null>(() => {
        return contextData?.subscriptionContext || null
    }, [contextData])

    const hasSubscription = useMemo<boolean>(() => {
        if (!subscriptionFeatures?.activeSubscriptionEndAt) return false
        return new Date(subscriptionFeatures.activeSubscriptionEndAt) > new Date()
    }, [subscriptionFeatures])

    const daysRemaining = useMemo<number>(() => {
        if (!subscriptionFeatures?.activeSubscriptionEndAt) return 0
        const endDateDayjs = dayjs(subscriptionFeatures.activeSubscriptionEndAt)
        const now = dayjs()
        const diff = endDateDayjs.diff(now, 'day', true)
        return Math.max(0, Math.ceil(diff))
    }, [subscriptionFeatures?.activeSubscriptionEndAt])

    const isFeatureAvailable = useCallback((feature: AvailableFeature): boolean => {
        if (!enableSubscriptions || !hasSubscriptionsFlag) return true
        if (!subscriptionFeatures) return false
        
        const featureKey = `${feature}EndAt` as keyof SubscriptionFeatures
        const featureDate = subscriptionFeatures[featureKey]
        if (featureDate === null) return false
        if (typeof featureDate !== 'string') return false
        
        const expirationDate = new Date(featureDate)
        const now = new Date()

        return expirationDate > now
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
        
        const b2bApps = subscriptionFeatures?.b2bApps || []
        const app = b2bApps.find(app => app.id === appId)
        
        if (!app) return false
        if (!app.endAt) return false
        
        return new Date(app.endAt) > new Date()
    }, [subscriptionFeatures, allEnabledB2BApps, hasSubscriptionsFlag])

    return {
        hasSubscription,
        isFeatureAvailable,
        isB2BAppEnabled,
        subscriptionContext,
        activeSubscriptionEndAt: subscriptionFeatures?.activeSubscriptionEndAt || null,
        daysRemaining,
        loading: orgLoading || plansLoading || contextLoading,
        hasAvailablePlans,
        refetch: refetchContext,
    }
}

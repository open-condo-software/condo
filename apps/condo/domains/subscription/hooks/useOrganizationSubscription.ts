import { useGetAvailableFeatureSubscriptionPlansQuery, useGetAvailableServiceSubscriptionPlansQuery, useGetSubscriptionContextByIdQuery } from '@app/condo/gql'
import dayjs from 'dayjs'
import getConfig from 'next/config'
import { useMemo, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useOrganization } from '@open-condo/next/organization'

import { SUBSCRIPTIONS } from '@condo/domains/common/constants/featureflags'
import { SUBSCRIPTION_PAYMENT_BUFFER_DAYS } from '@condo/domains/subscription/constants'

import type { GetSubscriptionContextByIdQuery } from '@app/condo/gql/operation.types'
import type { OrganizationSubscriptionFeatures } from '@app/condo/schema'
import type { AvailableFeatureType } from '@condo/domains/subscription/constants/features'


const { publicRuntimeConfig: { enableSubscriptions } } = getConfig()
const hasSubscriptionsFeature = Boolean(enableSubscriptions)

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

    const { data: allPlansData, loading: plansLoading } = useGetAvailableServiceSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id || '' },
        },
        skip: !organization?.id,
    })
    const { data: featurePlansData, loading: featurePlansLoading } = useGetAvailableFeatureSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id || '' },
        },
        skip: !organization?.id,
    })
    const hasAvailablePlans = useMemo(() => (allPlansData?.result?.plans || []).length > 0, [allPlansData?.result?.plans])

    const { useFlag } = useFeatureFlags()
    const hasSubscriptionsFlag = useFlag(SUBSCRIPTIONS)
    const hasSubscriptionsFeature = Boolean(enableSubscriptions) && hasSubscriptionsFlag

    const { data: contextData, loading: contextLoading, refetch: refetchContext } = useGetSubscriptionContextByIdQuery({
        variables: {
            id: subscriptionFeatures?.activeSubscriptionContextId || '',
        },
        skip: !subscriptionFeatures?.activeSubscriptionContextId || !hasSubscriptionsFeature,
    })

    const subscriptionContext = useMemo<SubscriptionContext | null>(() => {
        return contextData?.subscriptionContext || null
    }, [contextData])

    const hasSubscription = useMemo<boolean>(() => {
        if (!subscriptionFeatures?.activeSubscriptionEndAt) return false
        return new Date(subscriptionFeatures.activeSubscriptionEndAt) > new Date()
    }, [subscriptionFeatures])

    const activeSubscriptionEndAtWithoutBuffer = useMemo<dayjs.Dayjs | null>(() => {
        if (!subscriptionFeatures?.activeSubscriptionEndAt) return null
        const endAt = dayjs(subscriptionFeatures.activeSubscriptionEndAt)
        if (subscriptionContext?.isTrial) return endAt
        return endAt.subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'days')
    }, [subscriptionFeatures?.activeSubscriptionEndAt, subscriptionContext?.isTrial])

    const isInBufferPeriod = useMemo<boolean>(() => {
        if (!subscriptionContext || subscriptionContext.isTrial) return false
        if (!activeSubscriptionEndAtWithoutBuffer || !subscriptionFeatures?.activeSubscriptionEndAt) return false
        const now = dayjs()
        return now.isAfter(activeSubscriptionEndAtWithoutBuffer) && now.isBefore(dayjs(subscriptionFeatures.activeSubscriptionEndAt))
    }, [subscriptionContext, activeSubscriptionEndAtWithoutBuffer, subscriptionFeatures?.activeSubscriptionEndAt])

    const isFeatureAvailable = useCallback((feature: AvailableFeatureType): boolean => {
        if (!hasSubscriptionsFeature) return true
        if (!subscriptionFeatures) return false
        
        const featureKey = `${feature}EndAt` as keyof SubscriptionFeatures
        const featureDate = subscriptionFeatures[featureKey]
        if (featureDate === null) return false
        if (typeof featureDate !== 'string') return false
        
        const expirationDate = new Date(featureDate)
        const now = new Date()

        return expirationDate > now
    }, [subscriptionFeatures, hasSubscriptionsFeature])

    const allEnabledB2BApps = useMemo(() => {
        const plans = [
            ...(allPlansData?.result?.plans || []),
            ...(featurePlansData?.result?.plans || []),
        ]
        const appsSet = new Set<string>()
        plans.forEach(planInfo => {
            const enabledApps = planInfo?.plan?.enabledB2BApps || []
            enabledApps.forEach(appId => appsSet.add(appId))
        })
        return appsSet
    }, [allPlansData, featurePlansData])

    const isB2BAppEnabled = useCallback((appId: string): boolean => {
        if (!hasSubscriptionsFeature) return true
        if (!subscriptionFeatures) return false
        if (!allEnabledB2BApps.has(appId)) return true
        
        const b2bApps = subscriptionFeatures?.b2bApps || []
        const app = b2bApps.find(app => app.id === appId)
        
        if (!app) return false
        if (!app.endAt) return false
        
        return new Date(app.endAt) > new Date()
    }, [subscriptionFeatures, allEnabledB2BApps, hasSubscriptionsFeature])

    return {
        hasSubscriptionsFeature,
        hasSubscription,
        isFeatureAvailable,
        isB2BAppEnabled,
        subscriptionContext,
        activeSubscriptionEndAt: subscriptionFeatures?.activeSubscriptionEndAt || null,
        activeSubscriptionEndAtWithoutBuffer,
        isInBufferPeriod,
        loading: orgLoading || plansLoading || featurePlansLoading || contextLoading,
        hasAvailablePlans,
        refetch: refetchContext,
    }
}

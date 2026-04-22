import { useGetAvailableFeatureSubscriptionPlansQuery, useGetAvailableServiceSubscriptionPlansQuery, type GetAvailableFeatureSubscriptionPlansQuery } from '@app/condo/gql'
import getConfig from 'next/config'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { CURRENCY_SYMBOLS } from '@condo/domains/common/constants/currencies'

import { useActivateSubscriptions } from './useActivateSubscriptions'
import { useOrganizationSubscription } from './useOrganizationSubscription'

import type { AvailableFeatureType } from '../constants/features'


const { publicRuntimeConfig: { serverUrl } } = getConfig()

type FeaturePlan = NonNullable<NonNullable<GetAvailableFeatureSubscriptionPlansQuery['result']>['plans'][number]>

export const useFeatureSubscription = (feature: AvailableFeatureType, b2bAppId?: string) => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscriptionContext, isB2BAppEnabled, isFeatureAvailable, hasSubscriptionsFeature } = useOrganizationSubscription()
    const { registerSubscriptionContext } = useActivateSubscriptions()

    const skipQuery = !organization?.id || !hasSubscriptionsFeature

    const { data: featurePlansData, loading: featurePlansLoading } = useGetAvailableFeatureSubscriptionPlansQuery({
        variables: { organization: { id: organization?.id } },
        skip: skipQuery,
    })

    const { data: servicePlansData, loading: servicePlansLoading } = useGetAvailableServiceSubscriptionPlansQuery({
        variables: { organization: { id: organization?.id } },
        skip: skipQuery,
    })

    const isCurrentlyAvailable = feature === 'b2bApp'
        ? isB2BAppEnabled(b2bAppId || '')
        : isFeatureAvailable(feature)

    const featurePlanInfo = useMemo<FeaturePlan | null>(() => {
        if (!featurePlansData?.result?.plans) return null
        const plans = featurePlansData.result.plans.filter(Boolean) as FeaturePlan[]
        return plans.find(p => {
            if (feature === 'b2bApp') {
                const enabledApps: string[] = Array.isArray(p?.plan?.enabledB2BApps) ? p.plan.enabledB2BApps : []
                return b2bAppId ? enabledApps.includes(b2bAppId) : false
            }
            return Boolean((p?.plan as Record<string, unknown>)?.[feature])
        }) || null
    }, [featurePlansData, feature, b2bAppId])

    const featurePlanFirstPrice = featurePlanInfo?.prices?.[0] || null

    const promotedServicePlan = useMemo(() => {
        if (!servicePlansData?.result?.plans) return null
        const plans = servicePlansData.result.plans.filter(Boolean)
        return plans.find(p => {
            const plan = p?.plan
            if (!plan?.canBePromoted) return false
            if (feature === 'b2bApp') {
                const enabledApps: string[] = Array.isArray(plan.enabledB2BApps) ? plan.enabledB2BApps : []
                return b2bAppId ? enabledApps.includes(b2bAppId) : false
            }
            return Boolean((plan as Record<string, unknown>)?.[feature])
        })?.plan || null
    }, [servicePlansData, feature, b2bAppId])

    const currentServicePlanName = subscriptionContext?.subscriptionPlan?.name || null

    const formattedFeaturePrice = useMemo(() => {
        if (!featurePlanFirstPrice?.price || !featurePlanFirstPrice?.currencyCode) return null
        const priceInt = Math.floor(Number(featurePlanFirstPrice.price))
        const formatted = priceInt.toLocaleString(intl.locale).replace(/,/g, ' ')
        const symbol = CURRENCY_SYMBOLS[featurePlanFirstPrice.currencyCode]
        const priceStr = symbol ? `${formatted} ${symbol}` : `${formatted} ${featurePlanFirstPrice.currencyCode}`

        if (featurePlanFirstPrice.period) {
            const period = intl.formatMessage({ id: `subscription.planCard.planPrice.${featurePlanFirstPrice.period}.noun` as FormatjsIntl.Message['ids'] })
            return `${priceStr}/${period}`
        }
        
        return priceStr
    }, [featurePlanFirstPrice?.currencyCode, featurePlanFirstPrice?.period, featurePlanFirstPrice?.price, intl])

    const returnUrl = feature === 'b2bApp' && b2bAppId
        ? `${serverUrl}/miniapps/${b2bAppId}/about`
        : undefined

    const registerFeatureSubscription = useCallback(async ({ paymentType }: { paymentType: 'card' | 'userHelpRequest' }) => {
        if (!featurePlanFirstPrice?.id) return
        await registerSubscriptionContext({
            priceId: featurePlanFirstPrice.id,
            isTrial: false,
            planName: featurePlanInfo?.plan?.name || '',
            trialDays: 0,
            isCustomPrice: !featurePlanFirstPrice.price,
            paymentType,
            returnUrl,
        })
    }, [returnUrl, featurePlanFirstPrice?.id, featurePlanFirstPrice?.price, featurePlanInfo?.plan?.name, registerSubscriptionContext])

    const forPlanLabel = currentServicePlanName
        ? intl.formatMessage({ id: 'subscription.feature.forPlan' }, { planName: currentServicePlanName })
        : null
    const freeWithPlanLabel = promotedServicePlan?.name
        ? intl.formatMessage({ id: 'subscription.feature.freeWithPlan' }, { planName: promotedServicePlan.name })
        : null
    const aboutPlanLabel = promotedServicePlan?.name
        ? intl.formatMessage({ id: 'subscription.feature.aboutPlan' }, { planName: promotedServicePlan.name })
        : null

    return {
        isCurrentlyAvailable,
        hasFeaturePlan: Boolean(featurePlanInfo),
        featurePlanId: featurePlanInfo?.plan?.id || null,
        formattedFeaturePrice,
        forPlanLabel,
        freeWithPlanLabel,
        aboutPlanLabel,
        promotedServicePlan,
        registerFeatureSubscription,
        loading: featurePlansLoading || servicePlansLoading,
    }
}

import { useGetAvailableFeatureSubscriptionPlansQuery, useGetAvailableServiceSubscriptionPlansQuery, type GetAvailableFeatureSubscriptionPlansQuery } from '@app/condo/gql'
import getConfig from 'next/config'
import { useCallback, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { CURRENCY_SYMBOLS } from '@condo/domains/common/constants/currencies'
import { SUBSCRIPTIONS } from '@condo/domains/common/constants/featureflags'

import { useActivateSubscriptions } from './useActivateSubscriptions'
import { useOrganizationSubscription } from './useOrganizationSubscription'
import { useSubscriptionPaymentModal } from './useSubscriptionPaymentModal'


const { publicRuntimeConfig: { enableSubscriptions } } = getConfig()

type FeaturePlan = NonNullable<NonNullable<GetAvailableFeatureSubscriptionPlansQuery['result']>['plans'][number]>

export const useFeatureSubscriptionForApp = (appId: string) => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { useFlag } = useFeatureFlags()
    const hasSubscriptionsFlag = useFlag(SUBSCRIPTIONS)
    const { subscriptionContext, isB2BAppEnabled } = useOrganizationSubscription()
    const { registerSubscriptionContext, activateLoading, pendingRequests } = useActivateSubscriptions()

    const isEnabled = Boolean(enableSubscriptions) && hasSubscriptionsFlag
    const skipQuery = !organization?.id || !isEnabled

    const { data: featurePlansData, loading: featurePlansLoading } = useGetAvailableFeatureSubscriptionPlansQuery({
        variables: { organization: { id: organization?.id } },
        skip: skipQuery,
    })

    const { data: servicePlansData, loading: servicePlansLoading } = useGetAvailableServiceSubscriptionPlansQuery({
        variables: { organization: { id: organization?.id } },
        skip: skipQuery,
    })

    const isAppAvailableInCurrentTariff = isB2BAppEnabled(appId)

    const featurePlanInfo = useMemo<FeaturePlan | null>(() => {
        if (!featurePlansData?.result?.plans) return null
        const plans = featurePlansData.result.plans.filter(Boolean) as FeaturePlan[]
        return plans.find(p => {
            const enabledApps: string[] = Array.isArray(p?.plan?.enabledB2BApps) ? p.plan.enabledB2BApps : []
            return enabledApps.includes(appId)
        }) || null
    }, [featurePlansData, appId])

    const featurePlanFirstPrice = featurePlanInfo?.prices?.[0] || null

    const promotedServicePlan = useMemo(() => {
        if (!servicePlansData?.result?.plans) return null
        const plans = servicePlansData.result.plans.filter(Boolean)
        return plans.find(p => {
            const plan = p?.plan
            if (!plan?.canBePromoted) return false
            const enabledApps: string[] = Array.isArray(plan.enabledB2BApps) ? plan.enabledB2BApps : []
            return enabledApps.includes(appId)
        })?.plan || null
    }, [servicePlansData, appId])

    const hasPendingFeatureRequest = useMemo(() => {
        if (!featurePlanInfo?.plan?.id) return false
        return pendingRequests.some(
            req => req.subscriptionPlanPricingRule?.subscriptionPlan?.id === featurePlanInfo.plan.id
        )
    }, [pendingRequests, featurePlanInfo])

    const currentServicePlanName = subscriptionContext?.subscriptionPlan?.name || null

    const formattedFeaturePrice = useMemo(() => {
        if (!featurePlanFirstPrice?.price || !featurePlanFirstPrice?.currencyCode) return null
        const priceInt = Math.floor(Number(featurePlanFirstPrice.price))
        const formatted = priceInt.toLocaleString(intl.locale).replace(/,/g, ' ')
        const symbol = CURRENCY_SYMBOLS[featurePlanFirstPrice.currencyCode as keyof typeof CURRENCY_SYMBOLS]
        const priceStr = symbol ? `${formatted} ${symbol}` : `${formatted} ${featurePlanFirstPrice.currencyCode}`
        if (featurePlanFirstPrice.period) {
            const period = intl.formatMessage({ id: `subscription.planCard.planPrice.${featurePlanFirstPrice.period}` as FormatjsIntl.Message['ids'] })
            return `${priceStr}/${period}`
        }
        return priceStr
    }, [featurePlanFirstPrice, intl.locale])

    const registerFeatureSubscription = useCallback(async ({ paymentType }: { paymentType: 'card' | 'userHelpRequest' }) => {
        if (!featurePlanFirstPrice?.id) return
        await registerSubscriptionContext({
            priceId: featurePlanFirstPrice.id,
            isTrial: false,
            planName: featurePlanInfo?.plan?.name || '',
            trialDays: 0,
            isCustomPrice: !featurePlanFirstPrice.price,
            paymentType,
            returnUrl: `miniapps/${appId}/about`,
        })
    }, [featurePlanFirstPrice, featurePlanInfo, registerSubscriptionContext])

    const { PaymentModal, openModal: openPaymentModal } = useSubscriptionPaymentModal({
        registerSubscriptionContext: registerFeatureSubscription,
        activateLoading,
    })

    const forPlanLabel = currentServicePlanName
        ? intl.formatMessage({ id: 'miniapps.addDescription.featurePrice.forPlan' }, { planName: currentServicePlanName })
        : null
    const freeWithPlanLabel = promotedServicePlan?.name
        ? intl.formatMessage({ id: 'miniapps.addDescription.freeWithPlan' }, { planName: promotedServicePlan.name })
        : null
    const aboutPlanLabel = promotedServicePlan?.name
        ? intl.formatMessage({ id: 'miniapps.addDescription.aboutPlan' }, { planName: promotedServicePlan.name })
        : null

    return {
        isEnabled,
        isAppAvailableInCurrentTariff,
        hasFeaturePlan: Boolean(featurePlanInfo),
        featurePlanId: featurePlanInfo?.plan?.id || null,
        formattedFeaturePrice,
        forPlanLabel,
        freeWithPlanLabel,
        aboutPlanLabel,
        promotedServicePlan,
        hasPendingFeatureRequest,
        openPaymentModal,
        PaymentModal,
        loading: featurePlansLoading || servicePlansLoading,
    }
}

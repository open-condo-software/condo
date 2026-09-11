import {
    useGetAvailableServiceSubscriptionPlansQuery,
    useGetAvailableFeatureSubscriptionPlansQuery,
    useGetOrganizationActivatedSubscriptionsQuery,
    useGetSubscriptionB2BAppsQuery,
} from '@app/condo/gql'
import { useMemo, useState, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { SUBSCRIPTION_PERIOD } from '@condo/domains/subscription/constants'
import {
    buildCatalog,
    getCatalogCounters,
    getPlanCapabilities,
} from '@condo/domains/subscription/utils/subscriptionCatalog'
import {
    getDiscount,
    getMaxDiscountPercent,
    getPriceForPeriod,
} from '@condo/domains/subscription/utils/subscriptionPricing'

import { useOrganizationSubscription } from './useOrganizationSubscription'

import type {
    CapabilityKey,
    CapabilityLabel,
    CatalogPlanInfo,
    CatalogRow,
} from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanPeriod, PlanDiscount, PlanPrice } from '@condo/domains/subscription/utils/subscriptionPricing'


type ActivatedContext = ReturnType<typeof useGetOrganizationActivatedSubscriptionsQuery>['data']['activatedSubscriptions'][number]

/** Feature flags carry no name of their own, so the table borrows the plan card wording */
const FEATURE_LABEL_IDS: Record<string, string> = {
    payments: 'subscription.features.payments',
    meters: 'subscription.features.meters',
    tickets: 'subscription.features.tickets',
    news: 'subscription.features.news',
    marketplace: 'subscription.features.marketplace',
    support: 'subscription.features.personalManager',
    ai: 'subscription.features.ai',
    customization: 'subscription.features.customization',
    properties: 'subscription.features.properties',
    analytics: 'subscription.features.analytics',
}

/** Sales asked for the personal manager to always be the first upsell in the table */
const PINNED_CAPABILITIES: ReadonlyArray<CapabilityKey> = ['support']

export type ServicePlanView = {
    planInfo: CatalogPlanInfo
    price: PlanPrice | null
    discount: PlanDiscount | null
    featureCount: number
    serviceCount: number
    isActive: boolean
    isSelected: boolean
}

const isContextActive = (context: ActivatedContext): boolean => {
    const now = new Date()
    const hasStarted = !context.startAt || new Date(context.startAt) <= now
    const hasNotEnded = Boolean(context.endAt) && new Date(context.endAt) > now

    return hasStarted && hasNotEnded
}

/**
 * Everything the subscription settings page renders: plan cards, the feature table underneath
 * and the counters tying the two together. Kept in one hook so the cards and the table can never
 * disagree about which plan is selected or what it includes.
 */
export const useSubscriptionPlansPage = () => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { subscriptionContext: activeServiceContext } = useOrganizationSubscription()

    const [period, setPeriod] = useState<PlanPeriod>(SUBSCRIPTION_PERIOD.YEAR)
    const [selectedPlanIdOverride, setSelectedPlanIdOverride] = useState<string | null>(null)

    const organizationId = organization?.id

    const { data: servicePlansData, loading: servicePlansLoading } = useGetAvailableServiceSubscriptionPlansQuery({
        variables: { organization: { id: organizationId } },
        skip: !organizationId,
    })
    const { data: featurePlansData, loading: featurePlansLoading } = useGetAvailableFeatureSubscriptionPlansQuery({
        variables: { organization: { id: organizationId } },
        skip: !organizationId,
    })
    const {
        data: activatedData,
        loading: activatedLoading,
        refetch: refetchActivatedSubscriptions,
    } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: { organizationId: organizationId || '' },
        skip: !organizationId,
    })

    const servicePlans = useMemo<ReadonlyArray<CatalogPlanInfo>>(() => (
        (servicePlansData?.result?.plans ?? [])
            .filter(planInfo => Boolean(planInfo?.plan))
            .sort((left, right) => (left.plan?.priority ?? 0) - (right.plan?.priority ?? 0)) as CatalogPlanInfo[]
    ), [servicePlansData])

    const featurePlans = useMemo<ReadonlyArray<CatalogPlanInfo>>(() => (
        (featurePlansData?.result?.plans ?? []).filter(planInfo => Boolean(planInfo?.plan)) as CatalogPlanInfo[]
    ), [featurePlansData])

    const b2bAppIds = useMemo(() => {
        const ids = new Set<string>()
        for (const { plan } of [...servicePlans, ...featurePlans]) {
            const enabledApps = Array.isArray(plan?.enabledB2BApps) ? plan.enabledB2BApps as string[] : []
            enabledApps.forEach(appId => ids.add(appId))
        }
        return Array.from(ids)
    }, [servicePlans, featurePlans])

    const { data: b2bAppsData, loading: b2bAppsLoading } = useGetSubscriptionB2BAppsQuery({
        variables: { ids: b2bAppIds },
        skip: b2bAppIds.length === 0,
    })

    const activatedSubscriptions = useMemo(() => activatedData?.activatedSubscriptions ?? [], [activatedData])

    /** Feature plans currently usable by this organization, whether paid for or on trial */
    const activeFeatureContexts = useMemo(() => activatedSubscriptions.filter(context => (
        context?.subscriptionPlan?.planType === 'feature' && isContextActive(context)
    )), [activatedSubscriptions])

    const purchasedFeaturePlanIds = useMemo(
        () => new Set(activeFeatureContexts.map(context => context.subscriptionPlan.id)),
        [activeFeatureContexts]
    )

    const featureContextByPlanId = useMemo(() => {
        const map = new Map<string, ActivatedContext>()
        for (const context of activeFeatureContexts) {
            const planId = context.subscriptionPlan.id
            const known = map.get(planId)
            // several renewals can overlap, the one running longest is the one in force
            if (!known || new Date(context.endAt) > new Date(known.endAt)) map.set(planId, context)
        }
        return map
    }, [activeFeatureContexts])

    const capabilityLabels = useMemo<Record<CapabilityKey, CapabilityLabel>>(() => {
        const labels: Record<CapabilityKey, CapabilityLabel> = {}

        for (const [featureKey, messageId] of Object.entries(FEATURE_LABEL_IDS)) {
            labels[featureKey] = {
                label: intl.formatMessage({ id: messageId as FormatjsIntl.Message['ids'] }),
                description: intl.formatMessage({ id: `subscription.features.${featureKey}.description` as FormatjsIntl.Message['ids'] }),
            }
        }

        for (const app of b2bAppsData?.b2bApps ?? []) {
            if (!app?.id || !app?.name) continue
            labels[app.id] = { label: app.name, description: app.shortDescription ?? null }
        }

        return labels
    }, [intl, b2bAppsData])

    const activePlanId = activeServiceContext?.subscriptionPlan?.id ?? null

    /**
     * A plan with no pricing rule for the chosen period is not sold for that period, so it has
     * no price to show and nothing to buy — it stays off the page rather than rendering an
     * empty card.
     */
    const availablePlans = useMemo(
        () => servicePlans.filter(planInfo => Boolean(getPriceForPeriod(planInfo.prices, period))),
        [servicePlans, period]
    )

    const selectedPlanId = useMemo(() => {
        const availableIds = availablePlans.map(({ plan }) => plan.id)
        if (selectedPlanIdOverride && availableIds.includes(selectedPlanIdOverride)) return selectedPlanIdOverride
        if (activePlanId && availableIds.includes(activePlanId)) return activePlanId

        const promoted = availablePlans.find(({ plan }) => plan.canBePromoted)
        return promoted?.plan?.id ?? availableIds[0] ?? null
    }, [selectedPlanIdOverride, activePlanId, availablePlans])

    const selectedPlanInfo = useMemo(
        () => availablePlans.find(({ plan }) => plan.id === selectedPlanId) ?? null,
        [availablePlans, selectedPlanId]
    )

    const planCards = useMemo<ReadonlyArray<ServicePlanView>>(() => availablePlans.map(planInfo => {
        const capabilities = getPlanCapabilities(planInfo.plan)
        const appIds = new Set(b2bAppIds)

        return {
            planInfo,
            price: getPriceForPeriod(planInfo.prices, period),
            discount: getDiscount(planInfo.prices, period),
            featureCount: capabilities.filter(capability => !appIds.has(capability)).length,
            serviceCount: capabilities.filter(capability => appIds.has(capability)).length,
            isActive: planInfo.plan.id === activePlanId,
            isSelected: planInfo.plan.id === selectedPlanId,
        }
    }), [availablePlans, period, b2bAppIds, activePlanId, selectedPlanId])

    const rows = useMemo<ReadonlyArray<CatalogRow>>(() => buildCatalog({
        servicePlan: selectedPlanInfo?.plan ?? null,
        featurePlans,
        period,
        purchasedFeaturePlanIds,
        capabilityLabels,
        pinnedCapabilities: PINNED_CAPABILITIES,
    }), [selectedPlanInfo, featurePlans, period, purchasedFeaturePlanIds, capabilityLabels])

    const counters = useMemo(() => getCatalogCounters(rows), [rows])

    const maxDiscountPercent = useMemo(
        () => getMaxDiscountPercent(servicePlans.map(({ prices }) => prices)),
        [servicePlans]
    )

    const selectPlan = useCallback((planId: string) => setSelectedPlanIdOverride(planId), [])

    return {
        loading: servicePlansLoading || featurePlansLoading || activatedLoading || b2bAppsLoading,
        period,
        setPeriod,
        maxDiscountPercent,
        planCards,
        selectedPlanId,
        selectedPlanInfo,
        selectPlan,
        activePlanId,
        activeServiceContext,
        rows,
        counters,
        featureContextByPlanId,
        activatedSubscriptions,
        refetchActivatedSubscriptions,
    }
}

import {
    useGetAvailableServiceSubscriptionPlansQuery,
    useGetAvailableFeatureSubscriptionPlansQuery,
    useGetOrganizationActivatedSubscriptionsQuery,
    useGetOrganizationUnpaidSubscriptionsQuery,
    useGetSubscriptionB2BAppsQuery,
} from '@app/condo/gql'
import { useMemo, useState, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_PERIOD, SUBSCRIPTION_PLAN_FEATURES, SUBSCRIPTION_PLAN_TYPE_SERVICE } from '@condo/domains/subscription/constants'
import {
    buildCatalog,
    getCatalogCounters,
    getPlanCapabilities,
    OWNED_FEATURE_STATUSES,
    resolveFeatureStatus,
} from '@condo/domains/subscription/utils/subscriptionCatalog'
import { buildPlanCardAlerts } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'
import {
    getAmount,
    getDiscount,
    getMaxDiscountPercent,
    getPriceForPeriod,
} from '@condo/domains/subscription/utils/subscriptionPricing'

import { useOrganizationSubscription } from './useOrganizationSubscription'

import type { AvailableFeatureType } from '@condo/domains/subscription/constants/features'
import type {
    CapabilityKey,
    CapabilityLabel,
    CatalogPlanInfo,
    CatalogRow,
    FeatureStatus,
} from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanAlert } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'
import type { PlanPeriod, PlanDiscount, PlanPrice } from '@condo/domains/subscription/utils/subscriptionPricing'


type ActivatedContext = ReturnType<typeof useGetOrganizationActivatedSubscriptionsQuery>['data']['activatedSubscriptions'][number]

/**
 * Every key is 'subscription.features.<key>' by default. A few read differently in the tariff table than
 * elsewhere in the app (sales calls "support" the personal manager, and the table's own names for tickets/
 * meters/payments/ai follow the marketing copy, not the in-app section names).
 */
const FEATURE_LABEL_ID_OVERRIDES: Partial<Record<AvailableFeatureType, string>> = {
    support: 'subscription.features.personalManager',
    tickets: 'subscription.featureTable.tickets',
    meters: 'subscription.featureTable.meters',
    payments: 'subscription.featureTable.payments',
    ai: 'subscription.featureTable.ai',
}

/** Not part of the product's current feature comparison, so never a row even if some plan has the flag set */
const HIDDEN_FEATURES: ReadonlyArray<AvailableFeatureType> = ['analytics']

/** Sales asked for the personal manager to always be the first upsell in the table */
const PINNED_CAPABILITIES: ReadonlyArray<CapabilityKey> = ['support']

/**
 * Baseline product capabilities gated by no plan flag or miniapp - every plan lists them as included, none
 * sell them. "incidents" reuses the menu section's own label - the journal is the same thing either way.
 * The numbers are sales' fixed reading order for the table, personal manager aside (it stays pinned).
 */
const STATIC_ROWS: ReadonlyArray<{ key: string, labelId: string, sortPriority: number }> = [
    { key: 'incidents', labelId: 'global.section.incidents', sortPriority: 40 },
    { key: 'employees', labelId: 'subscription.featureTable.static.employees', sortPriority: 60 },
    { key: 'residents', labelId: 'subscription.featureTable.static.residents', sortPriority: 70 },
    { key: 'residentApp', labelId: 'subscription.featureTable.static.residentApp', sortPriority: 80 },
    { key: 'staffApp', labelId: 'subscription.featureTable.static.staffApp', sortPriority: 90 },
    { key: 'actGenerator', labelId: 'subscription.featureTable.static.actGenerator', sortPriority: 110 },
    { key: 'ticketBot', labelId: 'subscription.featureTable.static.ticketBot', sortPriority: 120 },
]

/** Same reading order, for the capability-only rows that have no feature plan of their own to carry a priority */
const CAPABILITY_SORT_PRIORITY: Record<string, number> = {
    tickets: 10,
    meters: 20,
    payments: 30,
    properties: 50,
    // never sold on its own, so it reads above every purchasable feature plan, same as tickets/meters/payments/properties
    ai: 55,
}

/** "Генератор объявлений" is a capability keyed by its app id, which differs per environment - matched by name */
const ANNOUNCEMENTS_APP_NAME = 'Генератор объявлений'
const ANNOUNCEMENTS_SORT_PRIORITY = 100

export type ServicePlanView = {
    planInfo: CatalogPlanInfo
    price: PlanPrice | null
    discount: PlanDiscount | null
    /** Everything the client can use on this plan, separately bought features included */
    featureCount: number
    /** Price of the paid features bought on top of the active plan, 0 for any other card */
    extraFeaturesAmount: number
    /** Payment and trial alerts of the card, most critical first */
    alerts: ReadonlyArray<PlanAlert>
    isActive: boolean
    /** The plan is paid for: a period is running, in its grace days or already bought for later */
    isPaid: boolean
    /** Last day the plan is paid for, null when it was never paid */
    paidUntil: string | null
    /** A lower plan than the paid one: it can be looked at but not bought */
    isBelowActive: boolean
    isSelected: boolean
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

    const {
        data: unpaidData,
        refetch: refetchUnpaidSubscriptions,
    } = useGetOrganizationUnpaidSubscriptionsQuery({
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

    const featureStatusByPlanId = useMemo(() => {
        const contextsByPlanId = new Map<string, ActivatedContext[]>()
        for (const context of activatedSubscriptions) {
            if (context?.subscriptionPlan?.planType !== 'feature') continue
            const planId = context.subscriptionPlan.id
            contextsByPlanId.set(planId, [...(contextsByPlanId.get(planId) ?? []), context])
        }

        const now = new Date()
        const statuses = new Map<string, FeatureStatus>()
        for (const [planId, contexts] of contextsByPlanId) {
            const status = resolveFeatureStatus(contexts, now, SUBSCRIPTION_PAYMENT_BUFFER_DAYS)
            if (status) statuses.set(planId, status)
        }
        return statuses
    }, [activatedSubscriptions])

    const purchasedFeaturePlanIds = useMemo(() => new Set(
        Array.from(featureStatusByPlanId)
            .filter(([, status]) => OWNED_FEATURE_STATUSES.includes(status.type))
            .map(([planId]) => planId)
    ), [featureStatusByPlanId])

    const capabilityLabels = useMemo<Record<CapabilityKey, CapabilityLabel>>(() => {
        const labels: Record<CapabilityKey, CapabilityLabel> = {}

        for (const featureKey of SUBSCRIPTION_PLAN_FEATURES) {
            if (HIDDEN_FEATURES.includes(featureKey)) continue

            const messageId = FEATURE_LABEL_ID_OVERRIDES[featureKey] ?? `subscription.features.${featureKey}`
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

    const capabilityPriorities = useMemo<Record<CapabilityKey, number>>(() => {
        const priorities: Record<CapabilityKey, number> = { ...CAPABILITY_SORT_PRIORITY }
        const announcementsApp = (b2bAppsData?.b2bApps ?? []).find(app => app?.name === ANNOUNCEMENTS_APP_NAME)
        if (announcementsApp?.id) priorities[announcementsApp.id] = ANNOUNCEMENTS_SORT_PRIORITY
        return priorities
    }, [b2bAppsData])

    const staticRows = useMemo(() => STATIC_ROWS.map(({ key, labelId, sortPriority }) => ({
        key: `static-${key}`,
        label: intl.formatMessage({ id: labelId as FormatjsIntl.Message['ids'] }),
        description: intl.formatMessage({ id: `subscription.featureTable.static.${key}.description` as FormatjsIntl.Message['ids'] }),
        sortPriority,
    })), [intl])

    const activePlanId = activeServiceContext?.subscriptionPlan?.id ?? null

    /**
     * Only a paid plan bars downgrades and repeated purchases: the one running now, the one still in its grace days
     * and the one already paid for a period that has not started yet. A trial, running or over, bars nothing —
     * once it ends the organization is still pointed at it, yet it has to be able to buy that plan or any other.
     */
    /** Last day every service plan is paid for, so a plan paid during its own trial no longer reads as a trial */
    const paidUntilByPlanId = useMemo(() => {
        const graceStart = Date.now() - SUBSCRIPTION_PAYMENT_BUFFER_DAYS * 24 * 60 * 60 * 1000
        const paidUntil = new Map<string, string>()

        for (const context of activatedSubscriptions) {
            const planId = context.subscriptionPlan?.id
            if (context.isTrial || context.subscriptionPlan?.planType !== SUBSCRIPTION_PLAN_TYPE_SERVICE) continue
            if (!planId || !context.endAt || new Date(context.endAt).getTime() <= graceStart) continue

            const known = paidUntil.get(planId)
            if (!known || new Date(context.endAt) > new Date(known)) paidUntil.set(planId, context.endAt)
        }

        return paidUntil
    }, [activatedSubscriptions])

    const paidPlanId = useMemo(() => {
        const paidContexts = activatedSubscriptions.filter(context => (
            context.subscriptionPlan?.id && paidUntilByPlanId.has(context.subscriptionPlan.id) && !context.isTrial
        ))
        // the highest plan paid for is the floor, a cheaper one bought earlier does not lower it
        const bestPaid = [...paidContexts].sort((left, right) => (right.subscriptionPlan?.priority ?? 0) - (left.subscriptionPlan?.priority ?? 0))[0]

        return bestPaid?.subscriptionPlan?.id ?? null
    }, [activatedSubscriptions, paidUntilByPlanId])

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

    // Every service plan's capabilities, not just the one on screen - a plan without one still lists it as unavailable
    const allPlanCapabilities = useMemo(() => {
        const capabilities = new Set<CapabilityKey>()
        for (const { plan } of servicePlans) {
            getPlanCapabilities(plan).forEach(capability => capabilities.add(capability))
        }
        return Array.from(capabilities)
    }, [servicePlans])

    const buildPlanRows = useCallback((planInfo: CatalogPlanInfo | null): ReadonlyArray<CatalogRow> => buildCatalog({
        servicePlan: planInfo?.plan ?? null,
        featurePlans,
        period,
        purchasedFeaturePlanIds,
        capabilityLabels,
        featureStatuses: featureStatusByPlanId,
        pinnedCapabilities: PINNED_CAPABILITIES,
        allPlanCapabilities,
        staticRows,
        capabilityPriorities,
    }), [featurePlans, period, purchasedFeaturePlanIds, capabilityLabels, featureStatusByPlanId, allPlanCapabilities, staticRows, capabilityPriorities])

    // read from every service plan, not only the ones sold for the selected period: a paid plan without a
    // price for that period is still the floor a purchase may only go up from
    const paidPriority = useMemo(
        () => servicePlans.find(({ plan }) => plan.id === paidPlanId)?.plan?.priority ?? null,
        [servicePlans, paidPlanId]
    )

    const planCards = useMemo<ReadonlyArray<ServicePlanView>>(() => availablePlans.map(planInfo => {
        const isActive = planInfo.plan.id === activePlanId
        const planRows = buildPlanRows(planInfo)
        const extraRows = planRows.filter(row => row.purchased && !row.includedInPlan)

        const extraFeaturesAmount = isActive
            ? extraRows
                .filter(row => row.status?.type === 'connected' || row.status?.type === 'paymentExpired')
                .reduce((sum, row) => sum + (getAmount(row.price) ?? 0), 0)
            : 0

        const alerts = buildPlanCardAlerts({
            planId: planInfo.plan.id,
            isActivePlan: isActive,
            activeServiceContext,
            unpaidContexts: unpaidData?.unpaidSubscriptions ?? [],
            paidContexts: activatedSubscriptions.filter(context => !context.isTrial),
            isPlanPaid: paidUntilByPlanId.has(planInfo.plan.id),
            trialContexts: activatedSubscriptions.filter(context => context.isTrial),
            now: new Date(),
        })

        return {
            planInfo,
            price: getPriceForPeriod(planInfo.prices, period),
            discount: getDiscount(planInfo.prices, period),
            featureCount: getCatalogCounters(planRows).included,
            extraFeaturesAmount,
            alerts,
            isActive,
            isPaid: paidUntilByPlanId.has(planInfo.plan.id),
            paidUntil: paidUntilByPlanId.get(planInfo.plan.id) ?? null,
            isBelowActive: paidPriority !== null && (planInfo.plan.priority ?? 0) < paidPriority,
            isSelected: planInfo.plan.id === selectedPlanId,
        }
    }), [availablePlans, period, activePlanId, paidPriority, paidUntilByPlanId, selectedPlanId, buildPlanRows, activeServiceContext, unpaidData, activatedSubscriptions])

    const rows = useMemo<ReadonlyArray<CatalogRow>>(
        () => buildPlanRows(selectedPlanInfo),
        [buildPlanRows, selectedPlanInfo]
    )

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
        paidPlanId,
        paidPriority,
        activeServiceContext,
        rows,
        counters,
        capabilityLabels,
        featureStatusByPlanId,
        activatedSubscriptions,
        refetchActivatedSubscriptions,
        refetchUnpaidSubscriptions,
    }
}

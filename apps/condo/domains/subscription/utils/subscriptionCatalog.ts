import dayjs from 'dayjs'

import { SUBSCRIPTION_PLAN_FEATURES } from '@condo/domains/subscription/constants'
import { ROUTE_FEATURE_MAPPING } from '@condo/domains/subscription/constants/routeFeatureMapping'
import { getPriceForPeriod } from '@condo/domains/subscription/utils/subscriptionPricing'

import type { PlanPeriod, PlanPrice } from '@condo/domains/subscription/utils/subscriptionPricing'


/** A feature flag key (`news`, `ai`, ...) or a B2B app id */
export type CapabilityKey = string

export type CatalogPlan = {
    id: string
    name: string
    description?: string | null
    planType?: string | null
    trialDays?: number | null
    priority?: number | null
    canBePromoted?: boolean | null
    enabledB2BApps?: unknown
    [featureFlag: string]: unknown
}

export type CatalogPlanInfo = {
    plan: CatalogPlan
    prices: ReadonlyArray<PlanPrice>
}

export type CapabilityLabel = {
    label: string
    description: string | null
}

export type FeatureStatusType = 'connected' | 'renewalCancelled' | 'trial' | 'trialExpired' | 'paymentExpired'

export type FeatureStatus = {
    type: FeatureStatusType
    /** Context the status is read from, the one a cancellation acts on */
    contextId: string
    endAt: string
    daysLeft: number
}

export type FeatureContext = {
    id: string
    isTrial?: boolean | null
    startAt?: string | null
    endAt?: string | null
    renewalCancelledAt?: string | null
}

/**
 * The table counts the feature as owned under these statuses. A removed feature keeps working until its
 * paid period ends, but the page already treats it as gone: it can be bought again right away.
 */
export const OWNED_FEATURE_STATUSES: ReadonlyArray<FeatureStatusType> = ['connected', 'trial', 'paymentExpired']

const DAY_MS = 24 * 60 * 60 * 1000

const byEndAtDesc = (left: FeatureContext, right: FeatureContext): number =>
    new Date(right.endAt).getTime() - new Date(left.endAt).getTime()

const resolveActiveStatusType = (context: FeatureContext): FeatureStatusType => {
    if (context.isTrial) return 'trial'
    if (context.renewalCancelledAt) return 'renewalCancelled'
    return 'connected'
}

/**
 * A paid period that ended less than `bufferDays` ago is still being renewed, so it reads as an expired
 * payment. Any other ended context, a cancelled one included, has used up the trial for good.
 */
export const resolveFeatureStatus = (
    contexts: ReadonlyArray<FeatureContext>,
    now: Date,
    bufferDays: number
): FeatureStatus | null => {
    const withEnd = contexts.filter(context => Boolean(context.endAt))
    const active = withEnd
        .filter(context => (!context.startAt || new Date(context.startAt) <= now) && new Date(context.endAt) > now)
        .sort(byEndAtDesc)[0]

    if (active) {
        const type = resolveActiveStatusType(active)
        const daysLeft = Math.max(0, Math.ceil((new Date(active.endAt).getTime() - now.getTime()) / DAY_MS))
        return { type, contextId: active.id, endAt: active.endAt, daysLeft }
    }

    const ended = withEnd.filter(context => new Date(context.endAt) <= now).sort(byEndAtDesc)[0]
    if (!ended) return null

    const isRenewing = !ended.isTrial && !ended.renewalCancelledAt
        && now.getTime() < new Date(ended.endAt).getTime() + bufferDays * DAY_MS

    return { type: isRenewing ? 'paymentExpired' : 'trialExpired', contextId: ended.id, endAt: ended.endAt, daysLeft: 0 }
}

type CancellableContext = {
    id: string
    isTrial?: boolean | null
    endAt?: string | null
    renewalCancelledAt?: string | null
    subscriptionPlan?: { id: string } | null
}

/**
 * Removing a feature has to stop every way it could still be charged: the paid periods that renew on
 * their own, a period still waiting in the grace days and the renewal registrations waiting for a payment.
 * Leaving any of them out would let the renewal job charge the card again or keep the unpaid alert on screen.
 */
export const getContextIdsToCancel = ({
    planIds,
    paidContexts,
    unpaidContexts,
    now,
    bufferDays,
}: {
    planIds: ReadonlyArray<string>
    paidContexts: ReadonlyArray<CancellableContext>
    unpaidContexts: ReadonlyArray<CancellableContext>
    now: Date
    bufferDays: number
}): ReadonlyArray<string> => {
    const graceStart = now.getTime() - bufferDays * DAY_MS
    const isOfPlan = (context: CancellableContext) => planIds.includes(context.subscriptionPlan?.id)

    const paidIds = paidContexts
        .filter(context => isOfPlan(context) && !context.isTrial && !context.renewalCancelledAt)
        .filter(context => context.endAt && new Date(context.endAt).getTime() > graceStart)
        .map(context => context.id)
    const unpaidIds = unpaidContexts
        .filter(context => isOfPlan(context) && !context.renewalCancelledAt)
        .map(context => context.id)

    return [...paidIds, ...unpaidIds]
}

export type CatalogRow = {
    /** Feature plan id when the row can be bought, otherwise the capability key */
    key: string
    label: string
    description: string | null
    capabilities: ReadonlyArray<CapabilityKey>
    /** Set when the row can be bought on its own */
    featurePlan: CatalogPlan | null
    /** Price for the period currently on screen */
    price: PlanPrice | null
    /** Every period the feature plan is sold for, needed to work out the yearly saving */
    prices: ReadonlyArray<PlanPrice>
    /** Included in the currently selected service plan, so it cannot be toggled off */
    includedInPlan: boolean
    /** Already paid for separately by this organization */
    purchased: boolean
    /** Where the organization stands with this feature plan, null when it never had it */
    status: FeatureStatus | null
    purchasable: boolean
}

const asArray = (value: unknown): ReadonlyArray<string> => Array.isArray(value) ? value as string[] : []

export const getPlanCapabilities = (plan: CatalogPlan | null | undefined): ReadonlyArray<CapabilityKey> => {
    if (!plan) return []
    const featureFlags = SUBSCRIPTION_PLAN_FEATURES.filter(feature => Boolean(plan[feature]))

    return [...featureFlags, ...asArray(plan.enabledB2BApps)]
}

/** A row is included only when the service plan covers everything the row unlocks */
const isCoveredBy = (capabilities: ReadonlyArray<CapabilityKey>, planCapabilities: ReadonlyArray<CapabilityKey>): boolean =>
    capabilities.length > 0 && capabilities.every(capability => planCapabilities.includes(capability))

type BuildCatalogParams = {
    servicePlan: CatalogPlan | null
    featurePlans: ReadonlyArray<CatalogPlanInfo>
    period: PlanPeriod
    /** Capability keys covered by feature plans the organization already paid for */
    purchasedFeaturePlanIds: ReadonlySet<string>
    capabilityLabels: Record<CapabilityKey, CapabilityLabel>
    featureStatuses?: ReadonlyMap<string, FeatureStatus>
    /** Rows that should always float to the top of the table, most important first */
    pinnedCapabilities?: ReadonlyArray<CapabilityKey>
}

/**
 * Builds the rows of the feature table. Rows are keyed by feature plan where one exists, so that
 * a plan unlocking several capabilities stays a single purchasable line, and by capability for
 * everything that only ever ships inside a service plan.
 *
 * The same rows back the "N features included / M more available" counters, which is what keeps
 * the counters from contradicting the table right below them.
 */
export const buildCatalog = ({
    servicePlan,
    featurePlans,
    period,
    purchasedFeaturePlanIds,
    capabilityLabels,
    featureStatuses,
    pinnedCapabilities = [],
}: BuildCatalogParams): ReadonlyArray<CatalogRow> => {
    const planCapabilities = getPlanCapabilities(servicePlan)
    const rows: CatalogRow[] = []
    const claimedCapabilities = new Set<CapabilityKey>()

    for (const { plan, prices } of featurePlans) {
        const capabilities = getPlanCapabilities(plan)
        if (capabilities.length === 0) continue

        capabilities.forEach(capability => claimedCapabilities.add(capability))

        const price = getPriceForPeriod(prices, period)
        const includedInPlan = isCoveredBy(capabilities, planCapabilities)
        const purchased = purchasedFeaturePlanIds.has(plan.id)
        const fallbackLabel = capabilityLabels[capabilities[0]]

        rows.push({
            key: plan.id,
            label: plan.name || fallbackLabel?.label || '',
            description: plan.description || fallbackLabel?.description || null,
            capabilities,
            featurePlan: plan,
            price,
            prices,
            includedInPlan,
            purchased,
            status: featureStatuses?.get(plan.id) ?? null,
            purchasable: !includedInPlan && !purchased && Boolean(price),
        })
    }

    for (const capability of planCapabilities) {
        if (claimedCapabilities.has(capability)) continue
        const labels = capabilityLabels[capability]
        if (!labels?.label) continue

        rows.push({
            key: capability,
            label: labels.label,
            description: labels.description,
            capabilities: [capability],
            featurePlan: null,
            price: null,
            prices: [],
            includedInPlan: true,
            purchased: false,
            status: null,
            purchasable: false,
        })
    }

    return sortCatalogRows(rows, pinnedCapabilities)
}

/**
 * Pinned rows always go first, then what the plan includes, then what was bought separately,
 * then what can still be bought.
 */
export const sortCatalogRows = (
    rows: ReadonlyArray<CatalogRow>,
    pinnedCapabilities: ReadonlyArray<CapabilityKey>
): ReadonlyArray<CatalogRow> => {
    const groupOf = (row: CatalogRow): number => {
        if (row.includedInPlan) return 0
        if (row.purchased) return 1
        return 2
    }
    const pinnedIndexOf = (row: CatalogRow): number => {
        const index = pinnedCapabilities.findIndex(capability => row.capabilities.includes(capability))
        return index >= 0 ? index : pinnedCapabilities.length
    }

    return [...rows].sort((left, right) => (
        pinnedIndexOf(left) - pinnedIndexOf(right)
        || groupOf(left) - groupOf(right)
        || left.label.localeCompare(right.label)
    ))
}

export type CatalogCounters = {
    /** Rows the organization can use with the selected plan, including separately bought ones */
    included: number
    available: number
}

export const getCatalogCounters = (rows: ReadonlyArray<CatalogRow>): CatalogCounters => ({
    included: rows.filter(row => row.includedInPlan || row.purchased).length,
    available: rows.filter(row => row.purchasable).length,
})

/** Trials ending on the same day as the plan's own trial are already shown on the plan card */
export const isSameDay = (left?: string | null, right?: string | null): boolean =>
    Boolean(left && right && dayjs(left).isSame(dayjs(right), 'day'))

/** Where a feature lives in the product: a B2B app page or the section its flag unlocks */
export const getFeaturePath = (row: CatalogRow): string | null => {
    const appIds = Array.isArray(row.featurePlan?.enabledB2BApps) ? row.featurePlan.enabledB2BApps as string[] : []
    if (appIds.length > 0) return `/miniapps/${appIds[0]}`

    const route = Object.entries(ROUTE_FEATURE_MAPPING).find(([, feature]) => row.capabilities.includes(feature))
    return route ? route[0] : null
}

export type UpsellCandidate = {
    plan: CatalogPlan
    /** Price of the plan for the period being bought, null when it has no price for that period */
    amount: number | null
}

/**
 * Buying features one by one can end up costing more than the plan that already contains them.
 * Finds the cheapest plan above the current one that covers everything in the cart for less,
 * which is what the checkout offers instead of the pile of separate features.
 */
export const findUpsellPlan = ({
    candidates,
    requiredCapabilities,
    cartAmount,
    minPriority,
}: {
    candidates: ReadonlyArray<UpsellCandidate>
    requiredCapabilities: ReadonlyArray<CapabilityKey>
    cartAmount: number
    minPriority: number
}): UpsellCandidate | null => {
    if (requiredCapabilities.length === 0) return null

    const affordable = candidates.filter(candidate => (
        (candidate.plan.priority ?? 0) > minPriority
        && candidate.amount !== null
        && candidate.amount < cartAmount
        && isCoveredBy(requiredCapabilities, getPlanCapabilities(candidate.plan))
    ))

    return [...affordable].sort((left, right) => left.amount - right.amount)[0] ?? null
}

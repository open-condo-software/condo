import { SUBSCRIPTION_PLAN_FEATURES } from '@condo/domains/subscription/constants'
import { getPriceForPeriod, isCustomPrice } from '@condo/domains/subscription/utils/subscriptionPricing'

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

export type CatalogRow = {
    /** Feature plan id when the row can be bought, otherwise the capability key */
    key: string
    label: string
    description: string | null
    /** Everything this row unlocks: feature flags and/or B2B app ids */
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
    /** Can be added to the cart right now */
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
            purchasable: !includedInPlan && !purchased && Boolean(price) && !isCustomPrice(price),
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
            purchasable: false,
        })
    }

    return sortCatalogRows(rows, pinnedCapabilities)
}

/**
 * Paid rows go above included ones so that switching between plan cards makes the difference
 * between plans read from the top of the table, with the pinned upsells first of all.
 */
export const sortCatalogRows = (
    rows: ReadonlyArray<CatalogRow>,
    pinnedCapabilities: ReadonlyArray<CapabilityKey>
): ReadonlyArray<CatalogRow> => {
    const weightOf = (row: CatalogRow): number => {
        const pinnedIndex = pinnedCapabilities.findIndex(capability => row.capabilities.includes(capability))
        if (pinnedIndex >= 0 && !row.includedInPlan) return pinnedIndex
        if (!row.includedInPlan) return pinnedCapabilities.length
        return pinnedCapabilities.length + 1
    }

    return [...rows].sort((left, right) => {
        const weightDiff = weightOf(left) - weightOf(right)
        if (weightDiff !== 0) return weightDiff

        return left.label.localeCompare(right.label)
    })
}

export type CatalogCounters = {
    /** Rows the organization can use with the selected plan, including separately bought ones */
    included: number
    /** Rows still available for purchase */
    available: number
}

export const getCatalogCounters = (rows: ReadonlyArray<CatalogRow>): CatalogCounters => ({
    included: rows.filter(row => row.includedInPlan || row.purchased).length,
    available: rows.filter(row => row.purchasable).length,
})

export type UpsellCandidate = {
    plan: CatalogPlan
    /** Price of the plan for the period being bought, null when it needs a manual offer */
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

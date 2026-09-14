import { useCallback, useEffect, useMemo, useState } from 'react'

import { getAmount, getDiscount, isCustomPrice } from '@condo/domains/subscription/utils/subscriptionPricing'

import type { ServicePlanView } from './useSubscriptionPlansPage'
import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanPeriod } from '@condo/domains/subscription/utils/subscriptionPricing'


/**
 * Features in different states never mix in one action bar. The first row the user picks decides
 * the group, and rows of any other group stay disabled until the selection is cleared.
 */
export type SelectionMode = 'idle' | 'buy' | 'connected' | 'paymentExpired'

type RowGroup = Exclude<SelectionMode, 'idle'>

export type SelectionTotals = {
    /** How many features the purchase covers: everything in the plan plus the extras picked */
    count: number
    /** Price without the yearly saving, only set when something is actually discounted */
    fullAmount: number | null
    amount: number
    discountAmount: number
    currencyCode: string | null
}

type UseSubscriptionSelectionParams = {
    rows: ReadonlyArray<CatalogRow>
    planCards: ReadonlyArray<ServicePlanView>
    selectedPlanId: string | null
    activePlanId: string | null
    period: PlanPeriod
    /** Features the selected plan already covers, counted into the cart when the plan is bought */
    includedCount: number
    /** The active plan's paid period is over, so the page offers to renew it */
    isActivePlanPaymentExpired: boolean
}

export const useSubscriptionSelection = ({
    rows,
    planCards,
    selectedPlanId,
    activePlanId,
    period,
    includedCount,
    isActivePlanPaymentExpired,
}: UseSubscriptionSelectionParams) => {
    const [mode, setMode] = useState<SelectionMode>('idle')
    const [selectedRowKeys, setSelectedRowKeys] = useState<ReadonlyArray<string>>([])

    const clearSelection = useCallback(() => {
        setMode('idle')
        setSelectedRowKeys([])
    }, [])

    const purchasedRowKeys = useMemo(
        () => rows.filter(row => row.status?.type === 'connected' || row.status?.type === 'paymentExpired').map(row => row.key),
        [rows]
    )
    const purchasedRowKeysSignature = purchasedRowKeys.join(',')

    const selectedPlanCard = useMemo(
        () => planCards.find(card => card.planInfo.plan.id === selectedPlanId) ?? null,
        [planCards, selectedPlanId]
    )

    const activePlanCard = useMemo(
        () => planCards.find(card => card.planInfo.plan.id === activePlanId) ?? null,
        [planCards, activePlanId]
    )

    /**
     * Downgrades are not offered: a lower plan can be opened to compare, but it never
     * produces an action bar. Anything above the active plan can be bought, as long as it has
     * a real price — a plan sold on request is handled by sales, not by the checkout.
     */
    const isPlanPurchasable = useMemo(() => {
        if (!selectedPlanCard || selectedPlanCard.isActive) return false
        if (!selectedPlanCard.price || isCustomPrice(selectedPlanCard.price)) return false
        if (!activePlanCard) return true

        const selectedPriority = selectedPlanCard.planInfo.plan.priority ?? 0
        const activePriority = activePlanCard.planInfo.plan.priority ?? 0

        return selectedPriority > activePriority
    }, [selectedPlanCard, activePlanCard])

    /**
     * A paid plan that is fine produces no action bar. Once its paid period is over, the page offers
     * a renewal instead: the plan goes back into the cart together with the features bought on top of it.
     */
    const isPlanRenewable = useMemo(() => {
        if (!isActivePlanPaymentExpired || !selectedPlanCard || !selectedPlanCard.isActive) return false

        return Boolean(selectedPlanCard.price) && !isCustomPrice(selectedPlanCard.price)
    }, [isActivePlanPaymentExpired, selectedPlanCard])

    // what is included, purchasable or already owned all change with the plan and the period, so a
    // cart assembled against the previous one would no longer mean anything. A paid plan opens with
    // everything it covers already picked, which makes renewing it a single click
    useEffect(() => {
        const preselected = isPlanRenewable ? purchasedRowKeysSignature.split(',').filter(Boolean) : []
        setSelectedRowKeys(preselected)
        setMode(preselected.length > 0 ? 'buy' : 'idle')
    }, [selectedPlanId, period, isPlanRenewable, purchasedRowKeysSignature])

    const rowsByKey = useMemo(() => new Map(rows.map(row => [row.key, row])), [rows])

    const isRowSelected = useCallback((row: CatalogRow) => selectedRowKeys.includes(row.key), [selectedRowKeys])

    const getRowGroup = useCallback((row: CatalogRow): RowGroup | null => {
        if (row.includedInPlan) return null
        const statusType = row.status?.type
        if (isPlanRenewable && (statusType === 'connected' || statusType === 'paymentExpired')) return 'buy'
        if (statusType === 'paymentExpired') return 'paymentExpired'
        if (statusType === 'connected') return 'connected'
        if (statusType === 'trial' || row.purchasable) return 'buy'

        return null
    }, [isPlanRenewable])

    const getRowPrice = (row: CatalogRow) => (row.price && !isCustomPrice(row.price) ? row.price : null)

    /** Included rows are on and frozen; the rest follow the group the first pick established */
    const isRowDisabled = useCallback((row: CatalogRow): boolean => {
        const group = getRowGroup(row)
        if (!group) return true
        if (group === 'buy' && !getRowPrice(row)) return true

        return mode !== 'idle' && mode !== group
    }, [mode, getRowGroup])

    /** Set when the row is blocked only because the selection already holds features in another state */
    const isRowBlockedByMode = useCallback((row: CatalogRow): boolean => {
        const group = getRowGroup(row)
        return Boolean(group) && mode !== 'idle' && mode !== group
    }, [mode, getRowGroup])

    const toggleRow = useCallback((row: CatalogRow) => {
        if (isRowDisabled(row)) return
        const group = getRowGroup(row)

        const next = selectedRowKeys.includes(row.key)
            ? selectedRowKeys.filter(key => key !== row.key)
            : [...selectedRowKeys, row.key]

        setSelectedRowKeys(next)
        setMode(next.length === 0 ? 'idle' : group)
    }, [selectedRowKeys, isRowDisabled, getRowGroup])

    const selectedRows = useMemo(
        () => selectedRowKeys.map(key => rowsByKey.get(key)).filter((row): row is CatalogRow => Boolean(row)),
        [selectedRowKeys, rowsByKey]
    )

    /** The plan joins the cart whenever it is on screen and can be bought or bought again */
    const isPlanInCart = (isPlanPurchasable || isPlanRenewable) && (mode === 'idle' || mode === 'buy')

    const totals = useMemo<SelectionTotals>(() => {
        const planPrice = isPlanInCart ? selectedPlanCard?.price ?? null : null
        const planDiscount = isPlanInCart ? selectedPlanCard?.discount ?? null : null

        const featurePrices = selectedRows.map(row => row.price)
        const prices = [planPrice, ...featurePrices].filter(Boolean)

        const amount = prices.reduce((sum, price) => sum + (getAmount(price) ?? 0), 0)
        const fullAmount = [
            planDiscount?.fullAmount ?? getAmount(planPrice) ?? 0,
            ...selectedRows.map(row => {
                const rowDiscount = getDiscount(row.prices, period)
                return rowDiscount?.fullAmount ?? getAmount(row.price) ?? 0
            }),
        ].reduce((sum, value) => sum + value, 0)

        const discountAmount = Math.max(0, fullAmount - amount)

        return {
            // buying a plan buys everything inside it, which is what the user is told they picked
            count: (isPlanInCart ? includedCount : 0) + selectedRows.length,
            fullAmount: discountAmount > 0 ? fullAmount : null,
            amount,
            discountAmount,
            currencyCode: prices.find(price => price?.currencyCode)?.currencyCode ?? null,
        }
    }, [isPlanInCart, selectedPlanCard, selectedRows, period, includedCount])

    return {
        mode,
        selectedRows,
        selectedRowKeys,
        isRowSelected,
        isRowDisabled,
        isRowBlockedByMode,
        toggleRow,
        clearSelection,
        isPlanInCart,
        isPlanPurchasable,
        isPlanRenewable,
        selectedPlanCard,
        totals,
    }
}

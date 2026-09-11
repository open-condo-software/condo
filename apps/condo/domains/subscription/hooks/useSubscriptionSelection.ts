import { useCallback, useEffect, useMemo, useState } from 'react'

import { getAmount, getDiscount, isCustomPrice } from '@condo/domains/subscription/utils/subscriptionPricing'

import type { ServicePlanView } from './useSubscriptionPlansPage'
import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanPeriod } from '@condo/domains/subscription/utils/subscriptionPricing'


/**
 * Buying and cancelling never mix in one action bar. The first toggle the user flips decides
 * which of the two they are doing, and everything that does not belong to that intent is
 * disabled until they clear the selection again.
 */
export type SelectionMode = 'idle' | 'add' | 'remove'

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
}

export const useSubscriptionSelection = ({
    rows,
    planCards,
    selectedPlanId,
    activePlanId,
    period,
    includedCount,
}: UseSubscriptionSelectionParams) => {
    const [mode, setMode] = useState<SelectionMode>('idle')
    const [selectedRowKeys, setSelectedRowKeys] = useState<ReadonlyArray<string>>([])

    const clearSelection = useCallback(() => {
        setMode('idle')
        setSelectedRowKeys([])
    }, [])

    // what is included, purchasable or already owned all change with the plan and the period,
    // so a cart assembled against the previous one would no longer mean anything
    useEffect(() => {
        clearSelection()
    }, [selectedPlanId, period, clearSelection])

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

    const rowsByKey = useMemo(() => new Map(rows.map(row => [row.key, row])), [rows])

    const isRowSelected = useCallback((row: CatalogRow) => selectedRowKeys.includes(row.key), [selectedRowKeys])

    /** Included rows are on and frozen; the rest follow the mode the first toggle established */
    const isRowDisabled = useCallback((row: CatalogRow): boolean => {
        if (row.includedInPlan) return true
        if (row.purchased) return mode === 'add'
        if (row.purchasable) return mode === 'remove'

        return true
    }, [mode])

    const toggleRow = useCallback((row: CatalogRow) => {
        if (row.includedInPlan) return
        if (!row.purchased && !row.purchasable) return

        const nextMode: SelectionMode = row.purchased ? 'remove' : 'add'
        if (mode !== 'idle' && mode !== nextMode) return

        const next = selectedRowKeys.includes(row.key)
            ? selectedRowKeys.filter(key => key !== row.key)
            : [...selectedRowKeys, row.key]

        setSelectedRowKeys(next)
        setMode(next.length === 0 ? 'idle' : nextMode)
    }, [mode, selectedRowKeys])

    const selectedRows = useMemo(
        () => selectedRowKeys.map(key => rowsByKey.get(key)).filter((row): row is CatalogRow => Boolean(row)),
        [selectedRowKeys, rowsByKey]
    )

    /** The plan joins the cart automatically whenever an unowned plan is on screen */
    const isPlanInCart = isPlanPurchasable && mode !== 'remove'

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
        toggleRow,
        clearSelection,
        isPlanInCart,
        isPlanPurchasable,
        selectedPlanCard,
        totals,
    }
}

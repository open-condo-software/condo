import { useRequestSubscriptionInvoiceMutation } from '@app/condo/gql'
import { notification } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Button, Dropdown, Typography } from '@open-condo/ui'

import { getFeaturePath } from '@condo/domains/subscription/utils/subscriptionCatalog'

import { useSubscriptionPaymentModal } from './useSubscriptionPaymentModal'

import type { useActivateSubscriptions } from './useActivateSubscriptions'
import type { PaymentType } from './useSubscriptionPaymentModal'
import type { ServicePlanView } from './useSubscriptionPlansPage'
import type { useTrialSubscriptions } from './useTrialSubscriptions'
import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanAlert } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'


type UseSubscriptionCheckoutParams = {
    planCards: ReadonlyArray<ServicePlanView>
    selectedRows: ReadonlyArray<CatalogRow>
    isPlanInCart: boolean
    selectedPlanCard: ServicePlanView | null
    clearSelection: () => void
    /** Trials are only offered while nothing in the cart has been tried or paid for yet */
    isBuying: boolean
    /** Features hang off a running plan: with none running they can only be bought together with a plan */
    needsPlanInCart: boolean
    hasSubscription: boolean
    trialSubscriptions: ReturnType<typeof useTrialSubscriptions>['trialSubscriptions']
    registerSubscriptionBundle: ReturnType<typeof useActivateSubscriptions>['registerSubscriptionBundle']
    activateLoading: boolean
    /** Re-reads both what the organization owns and what it still owes, so the page reflects a purchase at once */
    refetchSubscriptions: () => Promise<unknown>
    cancelFeaturePlans: (planIds: ReadonlyArray<string>) => Promise<void>
}

/**
 * Everything the settings page needs to let the client buy the cart, try it for free, ask sales for
 * an invoice again, or drop a feature: the checkout/remove modals, the action bar's callbacks and the
 * feature table's per-row trial button.
 */
export const useSubscriptionCheckout = ({
    planCards,
    selectedRows,
    isPlanInCart,
    selectedPlanCard,
    clearSelection,
    isBuying,
    needsPlanInCart,
    hasSubscription,
    trialSubscriptions,
    registerSubscriptionBundle,
    activateLoading,
    refetchSubscriptions,
    cancelFeaturePlans,
}: UseSubscriptionCheckoutParams) => {
    const intl = useIntl()
    const router = useRouter()
    const GoToFeatureMessage = intl.formatMessage({ id: 'subscription.activation.featureTrial.action' })

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [isRemoveOpen, setIsRemoveOpen] = useState(false)
    /** Set when the checkout upsell replaces the cart with a higher plan */
    const [upsellPlanId, setUpsellPlanId] = useState<string | null>(null)

    const cartPriceIds = useMemo(() => {
        const planPriceId = isPlanInCart ? selectedPlanCard?.price?.id : null
        const featurePriceIds = selectedRows.map(row => row.price?.id).filter(Boolean) as string[]

        return [planPriceId, ...featurePriceIds].filter(Boolean) as string[]
    }, [isPlanInCart, selectedPlanCard, selectedRows])

    const upsellPriceIds = useMemo(() => {
        if (!upsellPlanId) return []
        const upsellCard = planCards.find(card => card.planInfo.plan.id === upsellPlanId)

        return upsellCard?.price?.id ? [upsellCard.price.id] : []
    }, [upsellPlanId, planCards])

    const purchase = useCallback(async ({ paymentType }: { paymentType: PaymentType }) => {
        const priceIds = upsellPriceIds.length > 0 ? upsellPriceIds : cartPriceIds
        if (priceIds.length === 0) return

        await registerSubscriptionBundle({
            priceIds,
            isTrial: false,
            planName: selectedPlanCard?.planInfo?.plan?.name ?? '',
            trialDays: 0,
            paymentType,
            includesServicePlan: upsellPriceIds.length > 0 || isPlanInCart,
        })
        clearSelection()
        setUpsellPlanId(null)
        await refetchSubscriptions()
    }, [upsellPriceIds, cartPriceIds, registerSubscriptionBundle, selectedPlanCard, isPlanInCart, clearSelection, refetchSubscriptions])

    const [requestSubscriptionInvoice] = useRequestSubscriptionInvoiceMutation()

    /**
     * An invoice still waiting for its payment is only sent once more, nothing new is registered and the deadline stays.
     * An expired one is replaced: the same plan or features are registered again and get a fresh invoice
     */
    const handleInvoiceAction = useCallback(async (alert: PlanAlert) => {
        if (alert.type === 'invoicePending') {
            try {
                await requestSubscriptionInvoice({
                    variables: {
                        data: { dv: 1, sender: getClientSideSenderInfo(), subscriptionContexts: alert.contextIds.map(id => ({ id })) },
                    },
                })
                notification.success({ message: intl.formatMessage({ id: 'subscription.planCard.alert.invoicePending.requested' }), duration: 5 })
            } catch (error) {
                // The server already localizes rate-limit and similar errors into extensions.messageForUser - error.message stays in English
                const description = error?.graphQLErrors?.[0]?.extensions?.messageForUser || error?.message
                notification.error({ message: intl.formatMessage({ id: 'subscription.activation.errorTitle' }), description, duration: 5 })
            }
            return
        }

        await registerSubscriptionBundle({
            priceIds: alert.priceIds,
            isTrial: false,
            planName: alert.planNames.join(', '),
            paymentType: 'invoice',
            includesServicePlan: alert.scope === 'plan',
        })
        await refetchSubscriptions()
    }, [requestSubscriptionInvoice, intl, registerSubscriptionBundle, refetchSubscriptions])

    const { PaymentModal, openModal: openPaymentModal } = useSubscriptionPaymentModal({
        registerSubscriptionContext: purchase,
        activateLoading,
    })

    const openCheckout = useCallback(() => setIsCheckoutOpen(true), [])
    const closeCheckout = useCallback(() => setIsCheckoutOpen(false), [])

    const handleCheckoutConfirm = useCallback(() => {
        setUpsellPlanId(null)
        setIsCheckoutOpen(false)
        openPaymentModal()
    }, [openPaymentModal])

    const handleCheckoutUpsell = useCallback((planId: string) => {
        setUpsellPlanId(planId)
        setIsCheckoutOpen(false)
        openPaymentModal()
    }, [openPaymentModal])

    const openRemove = useCallback(() => setIsRemoveOpen(true), [])
    const closeRemove = useCallback(() => setIsRemoveOpen(false), [])

    const handleRemoveConfirm = useCallback(async () => {
        const planIds = selectedRows.map(row => row.featurePlan?.id).filter(Boolean)

        await cancelFeaturePlans(planIds)
        setIsRemoveOpen(false)
        clearSelection()
    }, [selectedRows, cancelFeaturePlans, clearSelection])

    /** A feature trial points straight at what was just unlocked, the shortest trial sets the deadline */
    const notifyFeatureTrial = useCallback((trialRows: ReadonlyArray<CatalogRow>) => {
        const days = Math.min(...trialRows.map(row => Number(row.featurePlan?.trialDays ?? 0)))
        const links = trialRows
            .map(row => ({ key: row.key, label: row.label, path: getFeaturePath(row) }))
            .filter(link => Boolean(link.path))
        const key = `subscription-feature-trial-${Date.now()}`
        const goTo = (path: string) => {
            notification.close(key)
            router.push(path)
        }

        let btn: React.ReactNode = null
        if (links.length === 1) {
            btn = <Button type='primary' onClick={() => goTo(links[0].path)}>{GoToFeatureMessage}</Button>
        } else if (links.length > 1) {
            btn = (
                <Dropdown.Button
                    type='primary'
                    items={links.map(link => ({ key: link.key, label: link.label, onClick: () => goTo(link.path) }))}
                >
                    {GoToFeatureMessage}
                </Dropdown.Button>
            )
        }

        notification.success({
            key,
            message: <Typography.Text strong>{intl.formatMessage({ id: 'subscription.activation.featureTrial.title' }, { days })}</Typography.Text>,
            description: intl.formatMessage({ id: 'subscription.activation.featureTrial.description' }),
            btn,
            duration: 10,
        })
    }, [GoToFeatureMessage, intl, router])

    const handleTryFree = useCallback(async () => {
        if (cartPriceIds.length === 0) return

        const trialDays = isPlanInCart
            ? Number(selectedPlanCard?.planInfo?.plan?.trialDays ?? 0)
            : Math.min(...selectedRows.map(row => Number(row.featurePlan?.trialDays ?? 0)))

        const isRegistered = await registerSubscriptionBundle({
            priceIds: cartPriceIds,
            isTrial: true,
            planName: isPlanInCart
                ? selectedPlanCard?.planInfo?.plan?.name ?? ''
                : selectedRows.map(row => row.label).join(', '),
            trialDays,
            includesServicePlan: isPlanInCart,
            notify: isPlanInCart,
        })
        if (isRegistered && !isPlanInCart) notifyFeatureTrial(selectedRows)
        clearSelection()
    }, [cartPriceIds, isPlanInCart, registerSubscriptionBundle, selectedPlanCard, selectedRows, clearSelection, notifyFeatureTrial])

    /** A feature keeps its own trial button until it is tried, bought or put in the cart; removing it burns the trial too */
    const canTryRow = useCallback((row: CatalogRow): boolean => {
        const plan = row.featurePlan
        // a feature trial also needs a running plan to hang off
        if (!hasSubscription || !plan || row.includedInPlan || row.purchased || row.status || Number(plan.trialDays ?? 0) <= 0) return false

        return !trialSubscriptions.some(trial => trial.subscriptionPlan?.id === plan.id)
    }, [hasSubscription, trialSubscriptions])

    const handleTryRow = useCallback(async (row: CatalogRow) => {
        if (!row.price?.id) return

        const isRegistered = await registerSubscriptionBundle({
            priceIds: [row.price.id],
            isTrial: true,
            planName: row.label,
            trialDays: Number(row.featurePlan?.trialDays ?? 0),
            includesServicePlan: false,
            notify: false,
        })
        if (isRegistered) notifyFeatureTrial([row])
    }, [registerSubscriptionBundle, notifyFeatureTrial])

    const canTryFree = useMemo(() => {
        if (!isBuying || needsPlanInCart) return false
        if (!isPlanInCart) return selectedRows.length > 0 && selectedRows.every(canTryRow)

        const plan = selectedPlanCard?.planInfo?.plan
        if (!plan || Number(plan.trialDays ?? 0) <= 0) return false

        return !trialSubscriptions.some(trial => trial.subscriptionPlan?.id === plan.id)
    }, [isBuying, needsPlanInCart, isPlanInCart, selectedRows, canTryRow, selectedPlanCard, trialSubscriptions])

    return {
        cartPriceIds,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
        upsellPlanId,
        handleCheckoutConfirm,
        handleCheckoutUpsell,
        PaymentModal,
        isRemoveOpen,
        openRemove,
        closeRemove,
        handleRemoveConfirm,
        handleInvoiceAction,
        canTryRow,
        handleTryRow,
        canTryFree,
        handleTryFree,
    }
}

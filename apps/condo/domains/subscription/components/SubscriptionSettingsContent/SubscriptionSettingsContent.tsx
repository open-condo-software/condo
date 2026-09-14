import dayjs from 'dayjs'
import getConfig from 'next/config'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Radio, Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { Loader } from '@condo/domains/common/components/Loader'
import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'
import { SUBSCRIPTION_PERIOD } from '@condo/domains/subscription/constants'
import {
    useActivateSubscriptions,
    useTrialSubscriptions,
    useOrganizationSubscription,
    useSubscriptionPlansPage,
    useSubscriptionSelection,
    useCancelSubscriptionFeatures,
} from '@condo/domains/subscription/hooks'
import { useSubscriptionPaymentModal } from '@condo/domains/subscription/hooks/useSubscriptionPaymentModal'
import { formatAmount, getAmount } from '@condo/domains/subscription/utils/subscriptionPricing'

import { PromoBanner } from './PromoBanner/PromoBanner'
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal/SubscriptionCheckoutModal'
import { SubscriptionFeatureTable } from './SubscriptionFeatureTable/SubscriptionFeatureTable'
import { SubscriptionPlanCard } from './SubscriptionPlanCard/SubscriptionPlanCard'
import { SubscriptionPlanSummary } from './SubscriptionPlanSummary/SubscriptionPlanSummary'
import { SubscriptionRemoveModal } from './SubscriptionRemoveModal/SubscriptionRemoveModal'
import styles from './SubscriptionSettingsContent.module.css'

import type { RowBadge } from './SubscriptionFeatureTable/SubscriptionFeatureTable'
import type { PaymentType } from '@condo/domains/subscription/hooks/useSubscriptionPaymentModal'
import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanAlert } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'
import type { PlanPeriod } from '@condo/domains/subscription/utils/subscriptionPricing'
import type { RadioChangeEvent } from 'antd'


const { publicRuntimeConfig: { HelpRequisites } } = getConfig()

const PLAN_CARD_EMOJIS = ['🏠', '🏁', '💼', '👑']

/** Trials ending on the same day as the plan's own trial are already shown on the plan card */
const isSameDay = (left?: string | null, right?: string | null): boolean =>
    Boolean(left && right && dayjs(left).isSame(dayjs(right), 'day'))

export const SubscriptionSettingsContent: React.FC = () => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const { role } = useOrganization()

    const YearlyLabel = intl.formatMessage({ id: 'subscription.period.yearly' })
    const MonthlyLabel = intl.formatMessage({ id: 'subscription.period.monthly' })
    const CheckoutMessage = intl.formatMessage({ id: 'subscription.actionBar.checkout' })
    const RenewMessage = intl.formatMessage({ id: 'subscription.actionBar.renew' })
    const RemoveMessage = intl.formatMessage({ id: 'subscription.actionBar.remove' })
    const CancelMessage = intl.formatMessage({ id: 'subscription.actionBar.cancel' })
    const ContactSupportMessage = intl.formatMessage({ id: 'subscription.actionBar.contactSupport' })

    const periodSwitchRef = useRef<HTMLDivElement>(null)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [isRemoveOpen, setIsRemoveOpen] = useState(false)
    /** Set when the checkout upsell replaces the cart with a higher plan */
    const [upsellPlanId, setUpsellPlanId] = useState<string | null>(null)

    const {
        loading,
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
        refetchActivatedSubscriptions,
        refetchUnpaidSubscriptions,
    } = useSubscriptionPlansPage()
    const { isInBufferPeriod } = useOrganizationSubscription()

    const { trialSubscriptions } = useTrialSubscriptions()
    const { registerSubscriptionBundle, activateLoading } = useActivateSubscriptions()

    const selection = useSubscriptionSelection({
        rows,
        planCards,
        selectedPlanId,
        activePlanId,
        period,
        includedCount: counters.included,
        isActivePlanPaymentExpired: Boolean(isInBufferPeriod),
    })

    const handleRefetch = useCallback(async () => {
        await Promise.all([refetchActivatedSubscriptions(), refetchUnpaidSubscriptions()])
    }, [refetchActivatedSubscriptions, refetchUnpaidSubscriptions])

    const { cancelFeatures, loading: cancelLoading } = useCancelSubscriptionFeatures({
        onCancelled: handleRefetch,
    })

    /** Clicking a plan card behaves like a tab: it scrolls the switch to the top and re-reads the table */
    const handleSelectPlan = useCallback((planId: string) => {
        selectPlan(planId)
        periodSwitchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [selectPlan])

    const handlePeriodChange = useCallback((event: RadioChangeEvent) => {
        setPeriod(event.target.value as PlanPeriod)
    }, [setPeriod])

    const canManageSubscriptions = Boolean(role?.canManageSubscriptions)

    /**
     * The plan card already carries a trial badge. A feature only gets its own badge in the
     * table when its trial runs on a different schedule than the plan's.
     */
    const getRowBadge = useCallback((row: CatalogRow): RowBadge | null => {
        const status = row.includedInPlan ? null : row.status
        if (!status) return null

        switch (status.type) {
            case 'connected':
                return { text: intl.formatMessage({ id: 'subscription.featureTable.badge.connected' }), bgColor: colors.green[5] }
            // Cancelling only stops the next renewal, so the feature keeps working until the period ends
            case 'renewalCancelled':
                return { text: intl.formatMessage({ id: 'subscription.planCard.badge.renewalCancelled' }), bgColor: colors.gray[7] }
            case 'trialExpired':
                return { text: intl.formatMessage({ id: 'subscription.planCard.badge.trialExpired' }), bgColor: colors.gray[7] }
            case 'paymentExpired':
                return { text: intl.formatMessage({ id: 'subscription.planCard.badge.paymentExpired' }), bgColor: colors.red[5] }
            case 'trial':
                // A trial running in step with the plan is already announced on the plan card
                if (isSameDay(status.endAt, activeServiceContext?.endAt)) return null
                return {
                    text: intl.formatMessage({ id: 'subscription.planCard.badge.activeDays' }, { days: status.daysLeft }),
                    bgColor: status.daysLeft <= 7 ? colors.orange[5] : colors.green[5],
                }
            default:
                return null
        }
    }, [activeServiceContext?.endAt, intl])

    const { totals, mode, selectedRows, isPlanInCart, isPlanRenewable, selectedPlanCard, clearSelection } = selection
    const isBuying = mode === 'idle' || mode === 'buy'

    /** Everything the checkout is about to buy, as pricing rule ids */
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
        await refetchUnpaidSubscriptions()
    }, [upsellPriceIds, cartPriceIds, registerSubscriptionBundle, selectedPlanCard, isPlanInCart, clearSelection, refetchUnpaidSubscriptions])

    /** An unpaid invoice has expired: the same plan or features get a fresh invoice */
    const handleReissueInvoice = useCallback(async (alert: PlanAlert) => {
        await registerSubscriptionBundle({
            priceIds: alert.priceIds,
            isTrial: false,
            planName: alert.planNames.join(', '),
            paymentType: 'invoice',
            includesServicePlan: alert.scope === 'plan',
        })
        await refetchUnpaidSubscriptions()
    }, [registerSubscriptionBundle, refetchUnpaidSubscriptions])

    const { PaymentModal, openModal: openPaymentModal } = useSubscriptionPaymentModal({
        registerSubscriptionContext: purchase,
        activateLoading,
    })

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

    const handleRemoveConfirm = useCallback(async () => {
        const contextIds = selectedRows.map(row => row.status?.contextId).filter(Boolean)

        await cancelFeatures(contextIds)
        setIsRemoveOpen(false)
        clearSelection()
    }, [selectedRows, cancelFeatures, clearSelection])

    const handleTryFree = useCallback(async () => {
        if (cartPriceIds.length === 0) return

        const trialDays = isPlanInCart
            ? Number(selectedPlanCard?.planInfo?.plan?.trialDays ?? 0)
            : Math.min(...selectedRows.map(row => Number(row.featurePlan?.trialDays ?? 0)))

        await registerSubscriptionBundle({
            priceIds: cartPriceIds,
            isTrial: true,
            planName: isPlanInCart
                ? selectedPlanCard?.planInfo?.plan?.name ?? ''
                : selectedRows.map(row => row.label).join(', '),
            trialDays,
            includesServicePlan: isPlanInCart,
        })
        clearSelection()
    }, [cartPriceIds, isPlanInCart, registerSubscriptionBundle, selectedPlanCard, selectedRows, clearSelection])

    const handleContactSupport = useCallback(() => {
        const supportEmail = HelpRequisites?.support_email || HelpRequisites?.email
        if (supportEmail) window.open(`mailto:${supportEmail}`, '_self')
    }, [])

    /** A feature keeps its own trial button until it is tried, bought or put in the cart */
    const canTryRow = useCallback((row: CatalogRow): boolean => {
        const plan = row.featurePlan
        if (!plan || row.includedInPlan || row.purchased || Number(plan.trialDays ?? 0) <= 0) return false

        return !trialSubscriptions.some(trial => trial.subscriptionPlan?.id === plan.id)
    }, [trialSubscriptions])

    const handleTryRow = useCallback(async (row: CatalogRow) => {
        if (!row.price?.id) return

        await registerSubscriptionBundle({
            priceIds: [row.price.id],
            isTrial: true,
            planName: row.label,
            trialDays: Number(row.featurePlan?.trialDays ?? 0),
            includesServicePlan: false,
        })
    }, [registerSubscriptionBundle])

    /** Trials are offered only while nothing in the cart has been tried or paid for yet */
    const canTryFree = useMemo(() => {
        if (!isBuying) return false
        if (!isPlanInCart) return selectedRows.length > 0 && selectedRows.every(canTryRow)

        const plan = selectedPlanCard?.planInfo?.plan
        if (!plan || Number(plan.trialDays ?? 0) <= 0) return false

        return !trialSubscriptions.some(trial => trial.subscriptionPlan?.id === plan.id)
    }, [isBuying, isPlanInCart, selectedRows, canTryRow, selectedPlanCard, trialSubscriptions])

    if (hidePaidFeatures) return null
    if (loading) return <Loader />

    const selectedPlanName = selectedPlanInfo?.plan?.name ?? ''
    const hasSelection = totals.count > 0 && (isPlanInCart || selectedRows.length > 0)

    const periodNoun = intl.formatMessage({ id: `subscription.planCard.planPrice.${period}.noun` as FormatjsIntl.Message['ids'] })
    const featuresAmount = selectedRows.reduce((sum, row) => sum + (getAmount(row.price) ?? 0), 0)
    const actionBarMessage = [
        isPlanInCart && selectedPlanCard ? intl.formatMessage(
            { id: 'subscription.actionBar.plan' },
            {
                planName: selectedPlanCard.planInfo.plan.name,
                amount: formatAmount(getAmount(selectedPlanCard.price), totals.currencyCode, intl.locale),
                period: periodNoun,
            }
        ) : null,
        selectedRows.length > 0 ? intl.formatMessage(
            { id: 'subscription.actionBar.features' },
            { count: selectedRows.length, amount: formatAmount(featuresAmount, totals.currencyCode, intl.locale), period: periodNoun }
        ) : null,
    ].filter(Boolean).join(' + ')

    const removeButton = (
        <Button
            key='remove'
            id='subscription-action-bar-remove-button'
            type='secondary'
            danger
            onClick={() => setIsRemoveOpen(true)}
            disabled={!canManageSubscriptions}
        >
            {RemoveMessage}
        </Button>
    )

    // The plan alone is bought or renewed without a way back; picked features can always be unpicked
    const cancelButton = selectedRows.length > 0 && !isPlanInCart ? [
        <Button key='cancel' id='subscription-action-bar-cancel-button' type='secondary' onClick={clearSelection}>
            {CancelMessage}
        </Button>,
    ] : []

    let actions: React.ReactElement[]
    if (mode === 'connected') {
        actions = [removeButton, ...cancelButton]
    } else if (mode === 'paymentExpired') {
        actions = [
            <Button key='support' id='subscription-action-bar-support-button' type='primary' onClick={handleContactSupport}>
                {ContactSupportMessage}
            </Button>,
            removeButton,
            ...cancelButton,
        ]
    } else {
        actions = [
            <Button
                key='checkout'
                id='subscription-action-bar-checkout-button'
                type='primary'
                onClick={() => setIsCheckoutOpen(true)}
                disabled={!canManageSubscriptions || cartPriceIds.length === 0}
            >
                {isPlanRenewable ? RenewMessage : CheckoutMessage}
            </Button>,
            ...(canTryFree ? [
                <Button
                    key='trial'
                    id='subscription-action-bar-trial-button'
                    type='secondary'
                    onClick={handleTryFree}
                    loading={activateLoading}
                    disabled={!canManageSubscriptions}
                >
                    {intl.formatMessage(
                        { id: 'subscription.planCard.tryFree' },
                        { formattedPrice: formatAmount(0, totals.currencyCode || 'RUB', intl.locale) }
                    )}
                </Button>,
            ] : []),
            ...cancelButton,
        ]
    }

    return (
        <>
            {PaymentModal}
            <SubscriptionCheckoutModal
                open={isCheckoutOpen}
                onCancel={() => setIsCheckoutOpen(false)}
                planCard={isPlanInCart ? selectedPlanCard : null}
                contextPlanName={selectedPlanName}
                selectedRows={selectedRows}
                includedCount={counters.included}
                period={period}
                planEndAt={activeServiceContext?.endAt ?? null}
                planCards={planCards}
                currentPlanPriority={Number(selectedPlanInfo?.plan?.priority ?? 0)}
                loading={activateLoading}
                onConfirm={handleCheckoutConfirm}
                onConfirmUpsell={handleCheckoutUpsell}
            />
            <SubscriptionRemoveModal
                open={isRemoveOpen}
                onCancel={() => setIsRemoveOpen(false)}
                rows={selectedRows}
                planName={selectedPlanName}
                paidUntil={selectedRows[0]?.status?.endAt ?? null}
                loading={cancelLoading}
                onConfirm={handleRemoveConfirm}
            />

            <div className={styles.page}>
                <PromoBanner />

                <div className={styles.periodSwitch} ref={periodSwitchRef}>
                    <div className={styles.periodSwitchInner}>
                        {maxDiscountPercent !== null && (
                            <span className={styles.periodDiscountBadge}>
                                <Tag bgColor={colors.green[5]} textColor={colors.white}>
                                    {intl.formatMessage(
                                        { id: 'subscription.period.yearly.discountBadge' },
                                        { percent: maxDiscountPercent }
                                    )}
                                </Tag>
                            </span>
                        )}
                        <Radio.Group optionType='button' value={period} onChange={handlePeriodChange}>
                            <Radio value={SUBSCRIPTION_PERIOD.YEAR} label={YearlyLabel} />
                            <Radio value={SUBSCRIPTION_PERIOD.MONTH} label={MonthlyLabel} />
                        </Radio.Group>
                    </div>
                </div>

                <div className={styles.planList} role='tablist'>
                    {planCards.map((card, index) => (
                        <SubscriptionPlanCard
                            key={card.planInfo.plan.id}
                            card={card}
                            emoji={PLAN_CARD_EMOJIS[index]}
                            activatedTrial={trialSubscriptions.find(
                                trial => trial.subscriptionPlan?.id === card.planInfo.plan.id
                            )}
                            onSelect={handleSelectPlan}
                            onReissueInvoice={handleReissueInvoice}
                            refetchActivatedSubscriptions={handleRefetch}
                        />
                    ))}
                </div>

                <div className={styles.tableSection}>
                    <SubscriptionPlanSummary planName={selectedPlanName} counters={counters} />
                    <SubscriptionFeatureTable
                        rows={rows}
                        period={period}
                        isRowSelected={selection.isRowSelected}
                        isRowDisabled={selection.isRowDisabled}
                        isRowBlockedByMode={selection.isRowBlockedByMode}
                        onToggleRow={selection.toggleRow}
                        canTryRow={canTryRow}
                        onTryRow={handleTryRow}
                        getRowBadge={getRowBadge}
                        canManageSubscriptions={canManageSubscriptions}
                    />
                </div>

                {hasSelection && (
                    <ActionBar
                        message={actionBarMessage}
                        actions={actions as [React.ReactElement, ...React.ReactElement[]]}
                    />
                )}
            </div>
        </>
    )
}

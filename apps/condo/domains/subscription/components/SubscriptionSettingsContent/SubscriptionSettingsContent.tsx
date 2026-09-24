import React, { useCallback, useRef } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Radio, Space, Tag, Typography } from '@open-condo/ui'
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
    useSubscriptionCheckout,
} from '@condo/domains/subscription/hooks'
import { usePaymentHistoryModal } from '@condo/domains/subscription/hooks/usePaymentHistoryModal'
import { isSameDay } from '@condo/domains/subscription/utils/subscriptionCatalog'
import { formatAmount, getAmount, getDiscount } from '@condo/domains/subscription/utils/subscriptionPricing'

import { PriceText } from './PriceText/PriceText'
import { PromoBanner } from './PromoBanner/PromoBanner'
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal/SubscriptionCheckoutModal'
import { SubscriptionFeatureTable } from './SubscriptionFeatureTable/SubscriptionFeatureTable'
import { SubscriptionPlanCard } from './SubscriptionPlanCard/SubscriptionPlanCard'
import { SubscriptionPlanSummary } from './SubscriptionPlanSummary/SubscriptionPlanSummary'
import { SubscriptionRemoveModal } from './SubscriptionRemoveModal/SubscriptionRemoveModal'
import styles from './SubscriptionSettingsContent.module.css'

import type { RowBadge } from './SubscriptionFeatureTable/SubscriptionFeatureTable'
import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanPeriod } from '@condo/domains/subscription/utils/subscriptionPricing'
import type { RadioChangeEvent } from 'antd'
import type { IntlShape } from 'react-intl'


const PLAN_CARD_EMOJIS = ['🏠', '🏁', '💼', '👑']

/**
 * The plan card already carries a trial badge. A feature only gets its own badge in the
 * table when its trial runs on a different schedule than the plan's.
 */
const buildRowBadge = (row: CatalogRow, intl: IntlShape, planEndAt?: string | null): RowBadge | null => {
    const status = row.includedInPlan ? null : row.status
    if (!status) return null

    switch (status.type) {
        case 'connected':
            return { text: intl.formatMessage({ id: 'subscription.featureTable.badge.connected' }), bgColor: colors.green[5] }
        // The feature keeps working until the paid period ends, but its trial is gone for good and it is sold again
        case 'renewalCancelled':
        case 'trialExpired':
            return { text: intl.formatMessage({ id: 'subscription.planCard.badge.trialExpired' }), bgColor: colors.gray[7] }
        case 'paymentExpired':
            return { text: intl.formatMessage({ id: 'subscription.planCard.badge.paymentExpired' }), bgColor: colors.red[5] }
        case 'trial':
            // A trial running in step with the plan is already announced on the plan card
            if (isSameDay(status.endAt, planEndAt)) return null
            return {
                text: intl.formatMessage({ id: 'subscription.planCard.badge.activeDays' }, { days: status.daysLeft }),
                bgColor: status.daysLeft <= 7 ? colors.orange[5] : colors.green[5],
            }
        default:
            return null
    }
}

export const SubscriptionSettingsContent: React.FC = () => {
    const intl = useIntl()
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const { role } = useOrganization()

    const YearlyLabel = intl.formatMessage({ id: 'subscription.period.yearly' })
    const MonthlyLabel = intl.formatMessage({ id: 'subscription.period.monthly' })
    const CheckoutMessage = intl.formatMessage({ id: 'subscription.actionBar.checkout' })
    const RemoveMessage = intl.formatMessage({ id: 'subscription.actionBar.remove' })
    const CancelMessage = intl.formatMessage({ id: 'subscription.actionBar.cancel' })
    const PaymentHistoryMessage = intl.formatMessage({ id: 'subscription.paymentHistory.title' })

    const periodSwitchRef = useRef<HTMLDivElement>(null)

    const {
        loading,
        period,
        setPeriod,
        maxDiscountPercent,
        planCards,
        selectedPlanId,
        selectedPlanInfo,
        selectPlan,
        paidPlanId,
        paidPriority,
        activeServiceContext,
        rows,
        counters,
        refetchActivatedSubscriptions,
        refetchUnpaidSubscriptions,
    } = useSubscriptionPlansPage()
    const { PaymentHistoryModal, openModal: openPaymentHistoryModal } = usePaymentHistoryModal()
    const { hasSubscription } = useOrganizationSubscription()

    const { trialSubscriptions } = useTrialSubscriptions()
    const { registerSubscriptionBundle, activateLoading } = useActivateSubscriptions()

    const selection = useSubscriptionSelection({
        rows,
        planCards,
        selectedPlanId,
        paidPlanId,
        paidPriority,
        period,
        includedCount: counters.included,
    })

    const handleRefetch = useCallback(async () => {
        await Promise.all([refetchActivatedSubscriptions(), refetchUnpaidSubscriptions()])
    }, [refetchActivatedSubscriptions, refetchUnpaidSubscriptions])

    const { cancelFeaturePlans, loading: cancelLoading } = useCancelSubscriptionFeatures({
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

    const getRowBadge = useCallback(
        (row: CatalogRow): RowBadge | null => buildRowBadge(row, intl, activeServiceContext?.endAt),
        [activeServiceContext?.endAt, intl]
    )

    const { totals, mode, selectedRows, isPlanInCart, selectedPlanCard, clearSelection } = selection
    const isBuying = mode === 'idle' || mode === 'buy'
    // Features hang off a running plan: with none running they can only be bought together with a plan
    const needsPlanInCart = !hasSubscription && !isPlanInCart

    const {
        cartPriceIds,
        isCheckoutOpen,
        openCheckout,
        closeCheckout,
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
    } = useSubscriptionCheckout({
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
        refetchUnpaidSubscriptions,
        cancelFeaturePlans,
    })

    if (hidePaidFeatures) return null
    if (loading) return <Loader />

    const selectedPlanName = selectedPlanInfo?.plan?.name ?? ''
    const hasSelection = totals.count > 0 && (isPlanInCart || selectedRows.length > 0)

    const periodNoun = intl.formatMessage({ id: `subscription.planCard.planPrice.${period}.noun` as FormatjsIntl.Message['ids'] })
    const featuresAmount = selectedRows.reduce((sum, row) => sum + (getAmount(row.price) ?? 0), 0)
    const featuresFullAmount = selectedRows.reduce((sum, row) => sum + (getDiscount(row.prices, period)?.fullAmount ?? getAmount(row.price) ?? 0), 0)
    const planPart = isPlanInCart && selectedPlanCard ? intl.formatMessage(
        { id: 'subscription.actionBar.plan' },
        {
            planName: selectedPlanCard.planInfo.plan.name,
            amount: (
                <PriceText
                    key='plan-amount'
                    amount={getAmount(selectedPlanCard.price) ?? 0}
                    fullAmount={isBuying ? selectedPlanCard.discount?.fullAmount ?? null : null}
                    currencyCode={totals.currencyCode}
                    locale={intl.locale}
                />
            ),
            period: periodNoun,
        }
    ) : null
    const featuresPart = selectedRows.length > 0 ? intl.formatMessage(
        { id: 'subscription.actionBar.features' },
        {
            count: selectedRows.length,
            amount: (
                <PriceText
                    key='features-amount'
                    amount={featuresAmount}
                    fullAmount={isBuying ? featuresFullAmount : null}
                    currencyCode={totals.currencyCode}
                    locale={intl.locale}
                />
            ),
            period: periodNoun,
        }
    ) : null
    // ActionBar takes a plain string only, the priced message goes in as the first element of the bar instead
    const actionBarMessage = (
        <Typography.Text key='message' strong>
            {planPart}
            {planPart && featuresPart && ' + '}
            {featuresPart}
        </Typography.Text>
    )

    const removeButton = (
        <Button
            key='remove'
            id='subscription-action-bar-remove-button'
            type='secondary'
            danger
            onClick={openRemove}
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
            <Button key='history' id='subscription-action-bar-payment-history-button' type='primary' onClick={openPaymentHistoryModal}>
                {PaymentHistoryMessage}
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
                onClick={openCheckout}
                disabled={!canManageSubscriptions || cartPriceIds.length === 0 || needsPlanInCart}
            >
                {CheckoutMessage}
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
            {PaymentHistoryModal}
            <SubscriptionCheckoutModal
                open={isCheckoutOpen}
                onCancel={closeCheckout}
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
                onCancel={closeRemove}
                names={selectedRows.map(row => row.label)}
                planName={selectedPlanName}
                paidUntil={selectedRows[0]?.status?.endAt ?? null}
                loading={cancelLoading}
                onConfirm={handleRemoveConfirm}
            />

            <Space size={40} direction='vertical' width='100%'>
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
                            onInvoiceAction={handleInvoiceAction}
                            refetchActivatedSubscriptions={handleRefetch}
                        />
                    ))}
                </div>

                <Space size={16} direction='vertical' width='100%'>
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
                </Space>

                {hasSelection && (
                    <ActionBar actions={[actionBarMessage, ...actions]} />
                )}
            </Space>
        </>
    )
}

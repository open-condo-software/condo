import { useRequestSubscriptionInvoiceMutation } from '@app/condo/gql'
import { notification } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Dropdown, Radio, Tag, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { Loader } from '@condo/domains/common/components/Loader'
import { UI_HIDE_PAID_FEATURES } from '@condo/domains/common/constants/featureflags'
import { SUBSCRIPTION_PERIOD } from '@condo/domains/subscription/constants'
import { ROUTE_FEATURE_MAPPING } from '@condo/domains/subscription/constants/routeFeatureMapping'
import {
    useActivateSubscriptions,
    useTrialSubscriptions,
    useOrganizationSubscription,
    useSubscriptionPlansPage,
    useSubscriptionSelection,
    useCancelSubscriptionFeatures,
} from '@condo/domains/subscription/hooks'
import { usePaymentHistoryModal } from '@condo/domains/subscription/hooks/usePaymentHistoryModal'
import { useSubscriptionPaymentModal } from '@condo/domains/subscription/hooks/useSubscriptionPaymentModal'
import { formatAmount, getAmount, getDiscount } from '@condo/domains/subscription/utils/subscriptionPricing'

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


const PLAN_CARD_EMOJIS = ['🏠', '🏁', '💼', '👑']

/** Trials ending on the same day as the plan's own trial are already shown on the plan card */
const isSameDay = (left?: string | null, right?: string | null): boolean =>
    Boolean(left && right && dayjs(left).isSame(dayjs(right), 'day'))

/** Where a feature lives in the product: a B2B app page or the section its flag unlocks */
const getFeaturePath = (row: CatalogRow): string | null => {
    const appIds = Array.isArray(row.featurePlan?.enabledB2BApps) ? row.featurePlan.enabledB2BApps as string[] : []
    if (appIds.length > 0) return `/miniapps/${appIds[0]}`

    const route = Object.entries(ROUTE_FEATURE_MAPPING).find(([, feature]) => row.capabilities.includes(feature))
    return route ? route[0] : null
}

type PriceTextProps = {
    amount: number
    fullAmount: number | null
    currencyCode: string | null
    locale: string
}

/** A discounted price is struck through and followed by the price actually paid, with the saving pinned above it */
const PriceText: React.FC<PriceTextProps> = ({ amount, fullAmount, currencyCode, locale }) => {
    if (!fullAmount || fullAmount <= amount) return <>{formatAmount(amount, currencyCode, locale)}</>

    return (
        <>
            <Typography.Text strong delete>{formatAmount(fullAmount, currencyCode, locale)}</Typography.Text>
            {' '}
            <span className={styles.discountedPrice}>
                <span className={styles.discountedPriceBadge}>
                    <Tag bgColor={colors.green[5]} textColor={colors.white}>{`-${formatAmount(fullAmount - amount, currencyCode, locale)}`}</Tag>
                </span>
                <Typography.Text strong type='success'>{formatAmount(amount, currencyCode, locale)}</Typography.Text>
            </span>
        </>
    )
}

export const SubscriptionSettingsContent: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const { useFlag } = useFeatureFlags()
    const hidePaidFeatures = useFlag(UI_HIDE_PAID_FEATURES)
    const { role } = useOrganization()

    const YearlyLabel = intl.formatMessage({ id: 'subscription.period.yearly' })
    const MonthlyLabel = intl.formatMessage({ id: 'subscription.period.monthly' })
    const CheckoutMessage = intl.formatMessage({ id: 'subscription.actionBar.checkout' })
    const RemoveMessage = intl.formatMessage({ id: 'subscription.actionBar.remove' })
    const CancelMessage = intl.formatMessage({ id: 'subscription.actionBar.cancel' })
    const PaymentHistoryMessage = intl.formatMessage({ id: 'subscription.paymentHistory.title' })
    const GoToFeatureMessage = intl.formatMessage({ id: 'subscription.activation.featureTrial.action' })

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
        paidPlanId,
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
            // The feature keeps working until the paid period ends, but its trial is gone for good and it is sold again
            case 'renewalCancelled':
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

    const { totals, mode, selectedRows, isPlanInCart, selectedPlanCard, clearSelection } = selection
    const isBuying = mode === 'idle' || mode === 'buy'
    // Features hang off a running plan: with none running they can only be bought together with a plan
    const needsPlanInCart = !hasSubscription && !isPlanInCart

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

    /** A client asks for an invoice again, or the old one has expired: the same plan or features get a fresh one */
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
                notification.error({ message: intl.formatMessage({ id: 'subscription.activation.errorTitle' }), description: error?.message, duration: 5 })
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
        await refetchUnpaidSubscriptions()
    }, [requestSubscriptionInvoice, intl, registerSubscriptionBundle, refetchUnpaidSubscriptions])

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

    /** Trials are offered only while nothing in the cart has been tried or paid for yet */
    const canTryFree = useMemo(() => {
        if (!isBuying || needsPlanInCart) return false
        if (!isPlanInCart) return selectedRows.length > 0 && selectedRows.every(canTryRow)

        const plan = selectedPlanCard?.planInfo?.plan
        if (!plan || Number(plan.trialDays ?? 0) <= 0) return false

        return !trialSubscriptions.some(trial => trial.subscriptionPlan?.id === plan.id)
    }, [isBuying, needsPlanInCart, isPlanInCart, selectedRows, canTryRow, selectedPlanCard, trialSubscriptions])

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
                onClick={() => setIsCheckoutOpen(true)}
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
                names={selectedRows.map(row => row.label)}
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
                            onInvoiceAction={handleInvoiceAction}
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
                    <ActionBar actions={[actionBarMessage, ...actions]} />
                )}
            </div>
        </>
    )
}

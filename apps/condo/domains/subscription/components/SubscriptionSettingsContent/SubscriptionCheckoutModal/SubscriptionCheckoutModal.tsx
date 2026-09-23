import dayjs from 'dayjs'
import React, { useMemo } from 'react'

import { QuestionCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Banner, Modal, Space, Tooltip, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { SUBSCRIPTION_PERIOD } from '@condo/domains/subscription/constants'
import { findUpsellPlan, getPlanCapabilities } from '@condo/domains/subscription/utils/subscriptionCatalog'
import { formatAmount, getAmount, getDiscount } from '@condo/domains/subscription/utils/subscriptionPricing'

import styles from './SubscriptionCheckoutModal.module.css'

import type { ServicePlanView } from '@condo/domains/subscription/hooks/useSubscriptionPlansPage'
import type { CatalogRow } from '@condo/domains/subscription/utils/subscriptionCatalog'
import type { PlanPeriod } from '@condo/domains/subscription/utils/subscriptionPricing'


type SubscriptionCheckoutModalProps = {
    open: boolean
    onCancel: () => void
    /** Set when the plan itself is being bought, null when only features are added */
    planCard: ServicePlanView | null
    /** Plan the added features attach to, used for the "+ N features for «X»" wording */
    contextPlanName: string
    selectedRows: ReadonlyArray<CatalogRow>
    /** Features already covered by the plan, shown in the subtitle */
    includedCount: number
    period: PlanPeriod
    /** When the current plan subscription runs out, if it can end before the new features do */
    planEndAt: string | null
    planCards: ReadonlyArray<ServicePlanView>
    currentPlanPriority: number
    loading: boolean
    onConfirm: () => void
    onConfirmUpsell: (planId: string) => void
}

type CheckoutLineProps = {
    label: string
    amount: string
    strikethroughAmount?: string | null
    note?: string | null
    strong?: boolean
}

const CheckoutLine: React.FC<CheckoutLineProps> = ({ label, amount, strikethroughAmount, note, strong }) => (
    <Space size={4} direction='vertical' width='100%'>
        <div className={styles.lineTop}>
            <Typography.Text strong={strong}>{label}</Typography.Text>
            <span className={styles.leader} />
            <Typography.Text strong={strong}>
                {strikethroughAmount && (
                    <>
                        <Typography.Text delete>{strikethroughAmount}</Typography.Text>
                        {' '}
                    </>
                )}
                {amount}
            </Typography.Text>
        </div>
        {note && (
            <div className={styles.lineNote}>
                <Typography.Text type='success' size='small'>{note}</Typography.Text>
            </div>
        )}
    </Space>
)

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
    open,
    onCancel,
    planCard,
    contextPlanName,
    selectedRows,
    includedCount,
    period,
    planEndAt,
    planCards,
    currentPlanPriority,
    loading,
    onConfirm,
    onConfirmUpsell,
}) => {
    const intl = useIntl()
    const BuyMessage = intl.formatMessage({ id: 'subscription.checkout.buy' })
    const TotalMessage = intl.formatMessage({ id: 'subscription.checkout.total' })
    const PlanRowMessage = intl.formatMessage({ id: 'subscription.checkout.row.plan' })

    const periodNoun = intl.formatMessage({
        id: `subscription.planCard.planPrice.${period}.noun` as FormatjsIntl.Message['ids'],
    })

    const planAmount = planCard ? getAmount(planCard.price) : null
    const planDiscount = planCard?.discount ?? null
    const currencyCode = planCard?.price?.currencyCode ?? selectedRows.find(row => row.price?.currencyCode)?.price?.currencyCode ?? null

    const featureLines = useMemo(() => selectedRows.map(row => ({
        key: row.key,
        label: row.label,
        amount: getAmount(row.price) ?? 0,
        discount: getDiscount(row.prices, period),
    })), [selectedRows, period])

    const total = (planAmount ?? 0) + featureLines.reduce((sum, line) => sum + line.amount, 0)

    const title = planCard
        ? intl.formatMessage(
            { id: 'subscription.checkout.title.plan' },
            { planName: planCard.planInfo.plan.name, period: periodNoun }
        )
        : intl.formatMessage(
            { id: 'subscription.checkout.title.features' },
            { count: selectedRows.length, planName: contextPlanName, period: periodNoun }
        )

    /**
     * Features bought on their own run for a full period, but the plan they hang off may expire
     * sooner. Only then is the client warned about the date they need to renew by.
     */
    const featuresEndAt = dayjs().add(period === SUBSCRIPTION_PERIOD.YEAR ? 12 : 1, 'month')
    const planEndsEarlier = Boolean(!planCard && planEndAt && dayjs(planEndAt).isBefore(featuresEndAt, 'day'))
    const formatDate = (date: dayjs.Dayjs) => date.format('D MMMM YYYY')

    const subtitle = planCard
        ? selectedRows.length > 0
            ? intl.formatMessage(
                { id: 'subscription.checkout.subtitle.withAdditional' },
                { planCount: includedCount, additionalCount: selectedRows.length }
            )
            : intl.formatMessage({ id: 'subscription.checkout.subtitle.planOnly' }, { count: includedCount })
        : planEndsEarlier
            ? intl.formatMessage({ id: 'subscription.checkout.connectedUntil' }, { date: formatDate(dayjs(planEndAt)) })
            : null

    const upsell = useMemo(() => {
        if (selectedRows.length === 0) return null

        const requiredCapabilities = selectedRows.flatMap(row => row.capabilities)
        const candidates = planCards.map(card => ({ plan: card.planInfo.plan, amount: getAmount(card.price) }))
        const found = findUpsellPlan({
            candidates,
            requiredCapabilities,
            cartAmount: total,
            minPriority: currentPlanPriority,
        })
        if (!found || (planCard && found.plan.id === planCard.planInfo.plan.id)) return null

        // how much more the client gets for less money, which is the whole point of the banner
        const extraCount = getPlanCapabilities(found.plan).length - requiredCapabilities.length

        return { ...found, extraCount: Math.max(0, extraCount) }
    }, [selectedRows, planCards, total, currentPlanPriority, planCard])

    const footer = upsell ? [
        <Button
            key='features'
            id='subscription-checkout-buy-features-button'
            type='secondary'
            onClick={onConfirm}
            loading={loading}
        >
            {intl.formatMessage({ id: 'subscription.checkout.upsell.buyFeatures' }, { count: selectedRows.length })}
        </Button>,
        <Button
            key='plan'
            id='subscription-checkout-buy-upsell-plan-button'
            type='primary'
            onClick={() => onConfirmUpsell(upsell.plan.id)}
            loading={loading}
        >
            {intl.formatMessage({ id: 'subscription.checkout.upsell.buyPlan' }, { planName: upsell.plan.name })}
        </Button>,
    ] : (
        <Button
            id='subscription-checkout-buy-button'
            type='primary'
            onClick={onConfirm}
            loading={loading}
        >
            {BuyMessage}
        </Button>
    )

    return (
        <Modal open={open} onCancel={onCancel} title={title} footer={footer}>
            <Space size={24} direction='vertical' width='100%'>
                {subtitle && (
                    <Space size={4} direction='horizontal' align='center'>
                        <Typography.Text type='secondary' size='small'>{subtitle}</Typography.Text>
                        {planEndsEarlier && (
                            <Tooltip
                                title={intl.formatMessage(
                                    { id: 'subscription.checkout.connectedUntil.hint' },
                                    { date: formatDate(dayjs(planEndAt)) }
                                )}
                            >
                                <span className={styles.hint}>
                                    <QuestionCircle color={colors.gray[7]} size='small' />
                                </span>
                            </Tooltip>
                        )}
                    </Space>
                )}

                <Space size={16} direction='vertical' width='100%'>
                    {planCard && (
                        <CheckoutLine
                            label={PlanRowMessage}
                            amount={formatAmount(planAmount, currencyCode, intl.locale)}
                            strikethroughAmount={planDiscount ? formatAmount(planDiscount.fullAmount, currencyCode, intl.locale) : null}
                            note={planDiscount ? intl.formatMessage(
                                { id: 'subscription.checkout.row.discount' },
                                { amount: formatAmount(planDiscount.discountAmount, currencyCode, intl.locale) }
                            ) : null}
                        />
                    )}
                    {featureLines.map(line => (
                        <CheckoutLine
                            key={line.key}
                            label={line.label}
                            amount={formatAmount(line.amount, currencyCode, intl.locale)}
                            strikethroughAmount={line.discount ? formatAmount(line.discount.fullAmount, currencyCode, intl.locale) : null}
                        />
                    ))}
                    <div className={styles.totalLine}>
                        <CheckoutLine
                            label={TotalMessage}
                            amount={formatAmount(total, currencyCode, intl.locale)}
                            strong
                        />
                    </div>
                </Space>

                {upsell && (
                    <Banner
                        title={intl.formatMessage(
                            { id: 'subscription.checkout.upsell.title' },
                            { planName: upsell.plan.name, amount: formatAmount(upsell.amount, currencyCode, intl.locale) }
                        )}
                        subtitle={intl.formatMessage(
                            { id: 'subscription.checkout.upsell.description' },
                            {
                                count: selectedRows.length,
                                amount: formatAmount(total, currencyCode, intl.locale),
                                planName: upsell.plan.name,
                                planAmount: formatAmount(upsell.amount, currencyCode, intl.locale),
                                extraCount: upsell.extraCount,
                            }
                        )}
                        backgroundColor={colors.blue[5]}
                        invertText
                        size='small'
                    />
                )}
            </Space>
        </Modal>
    )
}

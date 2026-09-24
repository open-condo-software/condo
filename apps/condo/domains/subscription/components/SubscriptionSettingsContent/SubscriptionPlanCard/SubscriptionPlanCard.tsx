import { OrganizationFeature } from '@app/condo/schema'
import classnames from 'classnames'
import dayjs from 'dayjs'
import React, { useCallback, useMemo, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { CreditCard, Bill } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography, Space, Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID } from '@condo/domains/common/constants/featureflags'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { useLinkedCardsModal } from '@condo/domains/subscription/hooks/useLinkedCardsModal'
import { usePaymentHistoryModal } from '@condo/domains/subscription/hooks/usePaymentHistoryModal'
import { formatAmount } from '@condo/domains/subscription/utils/subscriptionPricing'

import styles from './SubscriptionPlanCard.module.css'

import { PlanAlertBadge, SubscriptionPlanAlerts } from '../SubscriptionPlanAlerts/SubscriptionPlanAlerts'

import type { ServicePlanView } from '@condo/domains/subscription/hooks/useSubscriptionPlansPage'
import type { PlanAlert } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'


type TrialContext = { subscriptionPlan?: { id?: string } | null }

type SubscriptionPlanCardProps = {
    card: ServicePlanView
    emoji?: string
    activatedTrial?: TrialContext
    onSelect: (planId: string) => void
    onInvoiceAction: (alert: PlanAlert) => void
    refetchActivatedSubscriptions: () => Promise<void> | void
}

type SubscriptionPlanBadgeProps = {
    isActivePlan: boolean
    hasTrialExpired: boolean
}

const countdownColor = (daysRemaining: number): string => {
    if (daysRemaining <= 1) return colors.red[5]
    if (daysRemaining <= 7) return colors.orange[5]
    return colors.green[5]
}

/** a plan paid during its own trial runs until the paid period ends, not until the trial does */
const resolveEndDate = (paidUntil: string | null, endAtWithoutBuffer: dayjs.Dayjs | null): dayjs.Dayjs | null => {
    const now = dayjs()
    const paidUntilDate = paidUntil ? dayjs(paidUntil) : null

    if (paidUntilDate?.isAfter(now)) return paidUntilDate
    if (endAtWithoutBuffer?.isAfter(now)) return endAtWithoutBuffer

    return null
}

const formatEndDate = (date: dayjs.Dayjs | null): string | null => (
    date ? date.format(date.year() === dayjs().year() ? 'D MMMM' : 'D MMMM YYYY') : null
)

const SubscriptionPlanBadge: React.FC<SubscriptionPlanBadgeProps> = ({ isActivePlan, hasTrialExpired }) => {
    const intl = useIntl()
    const ActiveMessage = intl.formatMessage({ id: 'subscription.planCard.badge.active' })
    const ExpiredMessage = intl.formatMessage({ id: 'subscription.planCard.badge.trialExpired' })
    const PaymentExpiredMessage = intl.formatMessage({ id: 'subscription.planCard.badge.paymentExpired' })

    const { subscriptionContext, activeSubscriptionEndAtWithoutBuffer, isInBufferPeriod } = useOrganizationSubscription()

    const daysRemainingWithoutBuffer = activeSubscriptionEndAtWithoutBuffer
        ? Math.max(0, Math.ceil(activeSubscriptionEndAtWithoutBuffer.diff(dayjs(), 'day', true)))
        : 0

    const badge = useMemo<{ message: string, bgColor: string } | null>(() => {
        if (!isActivePlan) return hasTrialExpired ? { message: ExpiredMessage, bgColor: colors.gray[7] } : null
        // The paid period is over and the plan is only alive on the grace days, so the card says
        // the payment lapsed rather than counting down days the organization has not paid for
        if (isInBufferPeriod) return { message: PaymentExpiredMessage, bgColor: colors.red[5] }
        // the same context the header reads from - a real (non-trial) active context is what "Connected" means
        if (!subscriptionContext?.isTrial) return { message: ActiveMessage, bgColor: colors.green[5] }
        if (daysRemainingWithoutBuffer < 1 || daysRemainingWithoutBuffer > 30) return { message: ActiveMessage, bgColor: colors.green[5] }

        return {
            message: intl.formatMessage({ id: 'subscription.planCard.badge.activeDays' }, { days: daysRemainingWithoutBuffer }),
            bgColor: countdownColor(daysRemainingWithoutBuffer),
        }
    }, [isActivePlan, hasTrialExpired, ExpiredMessage, isInBufferPeriod, PaymentExpiredMessage, subscriptionContext?.isTrial, ActiveMessage, daysRemainingWithoutBuffer, intl])

    if (!badge) return null

    return (
        <span className={styles.badge}>
            <Tag bgColor={badge.bgColor} textColor={colors.white}>{badge.message}</Tag>
        </span>
    )
}

type SubscriptionPlanPriceProps = {
    card: ServicePlanView
    isFreeForPartner: boolean
    hasPaymentMethodForActivePlan: boolean
}

const SubscriptionPlanPrice: React.FC<SubscriptionPlanPriceProps> = ({
    card,
    isFreeForPartner,
    hasPaymentMethodForActivePlan,
}) => {
    const intl = useIntl()
    const FreeForPartnerMessage = intl.formatMessage({ id: 'subscription.planCard.freeForPartner' })

    const { activeSubscriptionEndAtWithoutBuffer } = useOrganizationSubscription()

    const { price, discount, extraFeaturesAmount, isActive, isPaid, paidUntil } = card

    /** The active plan shows what the organization pays in total, features bought on top included */
    const shownAmount = (isFreeForPartner ? 0 : Number(price?.price ?? 0)) + extraFeaturesAmount
    const showPriceForPartner = isFreeForPartner && extraFeaturesAmount > 0
    const showDiscount = Boolean(discount) && extraFeaturesAmount === 0
    const PeriodMessage = price?.period
        ? intl.formatMessage({ id: `subscription.planCard.planPrice.${price.period}` as FormatjsIntl.Message['ids'] })
        : ''

    const formattedEndDate = formatEndDate(isActive ? resolveEndDate(paidUntil, activeSubscriptionEndAtWithoutBuffer) : null)

    /**
     * The active plan swaps the period suffix for when it renews or runs out. Only the period itself reads as
     * part of the price («1000 ₽/в год»), a date is a sentence of its own and gets a separator instead of a slash
     */
    const priceSuffix = useMemo<{ text: string, isPeriod: boolean } | null>(() => {
        if (isFreeForPartner && !showPriceForPartner) return null
        if (formattedEndDate && hasPaymentMethodForActivePlan) {
            return { text: intl.formatMessage({ id: 'subscription.planCard.willBeCharged' }, { date: formattedEndDate }), isPeriod: false }
        }
        if (formattedEndDate && isPaid) {
            return { text: intl.formatMessage({ id: 'subscription.planCard.paidUntil' }, { date: formattedEndDate }), isPeriod: false }
        }

        return PeriodMessage ? { text: PeriodMessage, isPeriod: true } : null
    }, [isFreeForPartner, showPriceForPartner, formattedEndDate, hasPaymentMethodForActivePlan, isPaid, PeriodMessage, intl])

    if (isFreeForPartner && !showPriceForPartner) {
        return (
            <Typography.Text type='secondary'>
                {`✅ ${FreeForPartnerMessage}`}
            </Typography.Text>
        )
    }

    return (
        <>
            <Space size={8} wrap align='baseline'>
                {showDiscount && (
                    <Typography.Text type='secondary' delete>
                        {formatAmount(discount.fullAmount, price?.currencyCode, intl.locale)}
                    </Typography.Text>
                )}
                <Typography.Title level={3} type={showDiscount ? 'success' : undefined}>
                    {formatAmount(shownAmount, price?.currencyCode, intl.locale)}
                </Typography.Title>
                {priceSuffix && (
                    <Typography.Text type='secondary'>
                        {priceSuffix.isPeriod ? `/${priceSuffix.text}` : ` ${priceSuffix.text}`}
                    </Typography.Text>
                )}
            </Space>
            {showDiscount && (
                <Typography.Text type='success' size='small'>
                    {intl.formatMessage(
                        { id: 'subscription.planCard.discount' },
                        { amount: formatAmount(discount.discountAmount, price?.currencyCode, intl.locale) }
                    )}
                </Typography.Text>
            )}
        </>
    )
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
    card,
    emoji,
    activatedTrial,
    onSelect,
    onInvoiceAction,
    refetchActivatedSubscriptions,
}) => {
    const intl = useIntl()
    const LinkedCardsLinkLabel = intl.formatMessage({ id: 'subscription.linkedCards.title' })
    const PaymentHistoryLinkLabel = intl.formatMessage({ id: 'subscription.paymentHistory.title' })

    const { organization } = useOrganization()
    const { useFlagValue } = useFeatureFlags()
    const { subscriptionContext: activeServiceContext } = useOrganizationSubscription()

    const { planInfo, featureCount, alerts, isActive, isPaid, isBelowActive, isSelected } = card
    const { plan } = planInfo

    const [activeAlertIndex, setActiveAlertIndex] = useState(0)
    const alertIndex = Math.min(activeAlertIndex, Math.max(alerts.length - 1, 0))

    const activeBankingPlanId = useFlagValue(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID)
    const hasActiveBanking = organization?.features?.includes(OrganizationFeature.ActiveBanking)
    const isFreeForPartner = Boolean(hasActiveBanking && activeBankingPlanId && plan.id === activeBankingPlanId)

    const { LinkedCardsModal, openModal: openLinkedCardsModal, hasPaymentMethod } = useLinkedCardsModal({
        onCardUnbound: refetchActivatedSubscriptions,
    })
    const { PaymentHistoryModal, openModal: openPaymentHistoryModal, hasPaymentHistory } = usePaymentHistoryModal()

    const hasPaymentMethodForActivePlan = Boolean(isActive && activeServiceContext?.bindingId)
    // A paid plan links to its payments and cards however it was paid, a trial has nothing to show there yet
    const isPaidActivePlan = isActive && isPaid
    const showPaymentHistoryLink = isPaidActivePlan && hasPaymentHistory
    const showLinkedCardsLink = isPaidActivePlan && hasPaymentMethod

    /**
     * Top plans describe themselves ("all platform features"), the rest are read as a count.
     * The count covers everything the client can use on this plan, separate purchases included,
     * so it never contradicts the table right below the cards.
     */
    const summary = useMemo(() => (
        plan.description || intl.formatMessage({ id: 'subscription.planCard.featureCount' }, { count: featureCount })
    ), [plan.description, featureCount, intl])

    const handleSelect = useCallback(() => onSelect(plan.id), [onSelect, plan.id])
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onSelect(plan.id)
    }, [onSelect, plan.id])

    /** The whole card selects the plan, so the links inside it must not do that as well */
    const handlePaymentHistoryClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation()
        openPaymentHistoryModal()
    }, [openPaymentHistoryModal])
    const handleLinkedCardsClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation()
        openLinkedCardsModal()
    }, [openLinkedCardsModal])

    const cardClassName = classnames(styles.subscriptionPlanCard, {
        [styles.subscriptionPlanCardPromoted]: plan.canBePromoted,
        [styles.subscriptionPlanCardSelected]: isSelected,
    })
    const wrapperClassName = classnames(styles.cardWrapper, { [styles.cardWrapperBelowActive]: isBelowActive })

    return (
        <>
            {LinkedCardsModal}
            {PaymentHistoryModal}
            <div
                className={wrapperClassName}
                role='tab'
                tabIndex={0}
                aria-selected={isSelected}
                onClick={handleSelect}
                onKeyDown={handleKeyDown}
                id={`subscription-plan-card-${plan.id}`}
            >
                {alerts.length > 0 ? (
                    <span className={styles.badge}>
                        <PlanAlertBadge alert={alerts[alertIndex]} />
                    </span>
                ) : (
                    <SubscriptionPlanBadge
                        isActivePlan={isActive}
                        hasTrialExpired={Boolean(activatedTrial)}
                    />
                )}
                <Card className={cardClassName} width='100%'>
                    <div className={styles.cardBody}>
                        <div className={styles.cardHead}>
                            <Typography.Title level={3} ellipsis={false}>
                                {plan.name} {emoji ?? ''}
                            </Typography.Title>
                            <Typography.Paragraph type='secondary'>
                                {summary}
                            </Typography.Paragraph>
                        </div>

                        <div className={styles.cardFoot}>
                            <SubscriptionPlanPrice
                                card={card}
                                isFreeForPartner={isFreeForPartner}
                                hasPaymentMethodForActivePlan={hasPaymentMethodForActivePlan}
                            />

                            <SubscriptionPlanAlerts
                                alerts={alerts}
                                onChangeIndex={setActiveAlertIndex}
                                onInvoiceAction={onInvoiceAction}
                            />

                            {(showPaymentHistoryLink || showLinkedCardsLink) && (
                                <Space size={8} direction='vertical'>
                                    {showPaymentHistoryLink && <Typography.Link
                                        id={`subscription-plan-card-${plan.id}-payment-history-link`}
                                        onClick={handlePaymentHistoryClick}
                                    >
                                        <Space size={4} direction='horizontal' align='center'>
                                            <Bill size='small' />
                                            {PaymentHistoryLinkLabel}
                                        </Space>
                                    </Typography.Link>}
                                    {showLinkedCardsLink && <Typography.Link
                                        id={`subscription-plan-card-${plan.id}-linked-cards-link`}
                                        onClick={handleLinkedCardsClick}
                                    >
                                        <Space size={4} direction='horizontal' align='center'>
                                            <CreditCard size='small' />
                                            {LinkedCardsLinkLabel}
                                        </Space>
                                    </Typography.Link>}
                                </Space>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </>
    )
}

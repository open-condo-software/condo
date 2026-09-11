import { OrganizationFeature } from '@app/condo/schema'
import classnames from 'classnames'
import dayjs from 'dayjs'
import React, { useCallback, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { CreditCard, Bill } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography, Space, Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID } from '@condo/domains/common/constants/featureflags'
import { SubscriptionPaymentErrorAlert } from '@condo/domains/subscription/components/SubscriptionPaymentErrorAlert'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'
import { useLinkedCardsModal } from '@condo/domains/subscription/hooks/useLinkedCardsModal'
import { usePaymentHistoryModal } from '@condo/domains/subscription/hooks/usePaymentHistoryModal'
import { formatAmount, isCustomPrice } from '@condo/domains/subscription/utils/subscriptionPricing'

import styles from './SubscriptionPlanCard.module.css'

import type { ServicePlanView } from '@condo/domains/subscription/hooks/useSubscriptionPlansPage'


type TrialContext = { subscriptionPlan?: { id?: string } | null }

type SubscriptionPlanCardProps = {
    card: ServicePlanView
    emoji?: string
    activatedTrial?: TrialContext
    onSelect: (planId: string) => void
    refetchActivatedSubscriptions: () => Promise<void> | void
}

type SubscriptionPlanBadgeProps = {
    planId: string
    isActivePlan: boolean
    hasTrialExpired: boolean
    hasPaymentMethod: boolean
}

const SubscriptionPlanBadge: React.FC<SubscriptionPlanBadgeProps> = ({ isActivePlan, hasTrialExpired, hasPaymentMethod }) => {
    const intl = useIntl()
    const ActiveMessage = intl.formatMessage({ id: 'subscription.planCard.badge.active' })
    const ExpiredMessage = intl.formatMessage({ id: 'subscription.planCard.badge.trialExpired' })

    const { activeSubscriptionEndAt, activeSubscriptionEndAtWithoutBuffer, isInBufferPeriod } = useOrganizationSubscription()

    const daysRemainingWithoutBuffer = activeSubscriptionEndAtWithoutBuffer
        ? Math.max(0, Math.ceil(activeSubscriptionEndAtWithoutBuffer.diff(dayjs(), 'day', true)))
        : 0
    const daysRemainingWithBuffer = activeSubscriptionEndAt
        ? Math.max(0, Math.ceil(dayjs(activeSubscriptionEndAt).diff(dayjs(), 'day', true)))
        : 0

    let badgeMessage: string | null = hasTrialExpired ? ExpiredMessage : null
    let bgColor = colors.gray[7]

    if (isActivePlan) {
        bgColor = colors.green[5]

        if (hasPaymentMethod) {
            badgeMessage = ActiveMessage
        } else if (isInBufferPeriod) {
            badgeMessage = intl.formatMessage({ id: 'subscription.planCard.badge.activeDays' }, { days: daysRemainingWithBuffer })
            bgColor = colors.red[5]
        } else if (daysRemainingWithoutBuffer > 0 && daysRemainingWithoutBuffer <= 30) {
            badgeMessage = intl.formatMessage({ id: 'subscription.planCard.badge.activeDays' }, { days: daysRemainingWithoutBuffer })

            if (daysRemainingWithoutBuffer <= 7) bgColor = colors.orange[5]
            if (daysRemainingWithoutBuffer <= 1) bgColor = colors.red[5]
        } else {
            badgeMessage = ActiveMessage
        }
    }

    if (!badgeMessage) return null

    return (
        <span className={styles.badge}>
            <Tag bgColor={bgColor} textColor={colors.white}>{badgeMessage}</Tag>
        </span>
    )
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
    card,
    emoji,
    activatedTrial,
    onSelect,
    refetchActivatedSubscriptions,
}) => {
    const intl = useIntl()
    const FreeForPartnerMessage = intl.formatMessage({ id: 'subscription.planCard.freeForPartner' })
    const LinkedCardsLinkLabel = intl.formatMessage({ id: 'subscription.linkedCards.title' })
    const PaymentHistoryLinkLabel = intl.formatMessage({ id: 'subscription.paymentHistory.title' })

    const { organization } = useOrganization()
    const { useFlagValue } = useFeatureFlags()
    const { subscriptionContext: activeServiceContext, activeSubscriptionEndAtWithoutBuffer } = useOrganizationSubscription()

    const { planInfo, price, discount, featureCount, serviceCount, isActive, isSelected } = card
    const { plan } = planInfo

    const activeBankingPlanId = useFlagValue(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID)
    const hasActiveBanking = organization?.features?.includes(OrganizationFeature.ActiveBanking)
    const isFreeForPartner = Boolean(hasActiveBanking && activeBankingPlanId && plan.id === activeBankingPlanId)

    const { LinkedCardsModal, openModal: openLinkedCardsModal, hasPaymentMethod } = useLinkedCardsModal({
        onCardUnbound: refetchActivatedSubscriptions,
    })
    const { PaymentHistoryModal, openModal: openPaymentHistoryModal } = usePaymentHistoryModal()

    const hasPaymentMethodForActivePlan = Boolean(isActive && activeServiceContext?.bindingId)

    /**
     * Top plans describe themselves ("all platform features"), the rest are read as a count.
     * The count covers everything the client can use on this plan, separate purchases included,
     * so it never contradicts the table right below the cards.
     */
    const summary = useMemo(() => {
        if (plan.description) return plan.description

        const features = intl.formatMessage({ id: 'subscription.planCard.featureCount' }, { count: featureCount })
        if (serviceCount <= 0) return features

        const services = intl.formatMessage({ id: 'subscription.planCard.serviceCount' }, { count: serviceCount })

        return intl.formatMessage({ id: 'subscription.planCard.featuresAndServices' }, { features, services })
    }, [plan.description, featureCount, serviceCount, intl])

    const hasCustomPrice = isCustomPrice(price)
    const PeriodMessage = price?.period
        ? intl.formatMessage({ id: `subscription.planCard.planPrice.${price.period}` as FormatjsIntl.Message['ids'] })
        : ''

    const endDate = isActive && activeSubscriptionEndAtWithoutBuffer?.isAfter(dayjs())
        ? activeSubscriptionEndAtWithoutBuffer
        : null
    const formattedEndDate = endDate
        ? endDate.format(endDate.year() === dayjs().year() ? 'D MMMM' : 'D MMMM YYYY')
        : null

    /** The active plan swaps the period suffix for when it renews or runs out */
    const periodMessage = useMemo(() => {
        if (isFreeForPartner) return null
        if (isActive && formattedEndDate) {
            if (hasPaymentMethodForActivePlan) {
                return intl.formatMessage({ id: 'subscription.planCard.willBeCharged' }, { date: formattedEndDate })
            }
            if (!activeServiceContext?.isTrial) {
                return intl.formatMessage({ id: 'subscription.planCard.paidUntil' }, { date: formattedEndDate })
            }
        }

        return PeriodMessage
    }, [isFreeForPartner, isActive, formattedEndDate, hasPaymentMethodForActivePlan, activeServiceContext?.isTrial, PeriodMessage, intl])

    const handleSelect = useCallback(() => onSelect(plan.id), [onSelect, plan.id])
    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        onSelect(plan.id)
    }, [onSelect, plan.id])

    /** The whole card selects the plan, so the links inside it must not do that as well */
    const stopSelection = useCallback((event: React.MouseEvent) => event.stopPropagation(), [])

    const cardClassName = classnames(styles.subscriptionPlanCard, {
        [styles.subscriptionPlanCardPromoted]: plan.canBePromoted,
        [styles.subscriptionPlanCardSelected]: isSelected,
    })

    return (
        <>
            {LinkedCardsModal}
            {PaymentHistoryModal}
            <div
                className={styles.cardWrapper}
                role='tab'
                tabIndex={0}
                aria-selected={isSelected}
                onClick={handleSelect}
                onKeyDown={handleKeyDown}
                id={`subscription-plan-card-${plan.id}`}
            >
                <SubscriptionPlanBadge
                    planId={plan.id}
                    isActivePlan={isActive}
                    hasTrialExpired={Boolean(activatedTrial)}
                    hasPaymentMethod={hasPaymentMethodForActivePlan}
                />
                <Card className={cardClassName}>
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
                            {isFreeForPartner ? (
                                <Typography.Text type='secondary'>
                                    {`✅ ${FreeForPartnerMessage}`}
                                </Typography.Text>
                            ) : hasCustomPrice ? (
                                <Typography.Text type='secondary'>{price?.name}</Typography.Text>
                            ) : (
                                <>
                                    <div className={styles.priceLine}>
                                        {discount && (
                                            <Typography.Text type='secondary' delete>
                                                {formatAmount(discount.fullAmount, price?.currencyCode, intl.locale)}
                                            </Typography.Text>
                                        )}
                                        <Typography.Title level={3} type={discount ? 'success' : undefined}>
                                            {formatAmount(Number(price?.price), price?.currencyCode, intl.locale)}
                                        </Typography.Title>
                                        {periodMessage && (
                                            <Typography.Text type='secondary'>{` /${periodMessage}`}</Typography.Text>
                                        )}
                                    </div>
                                    {discount && (
                                        <Typography.Text type='success' size='small'>
                                            {intl.formatMessage(
                                                { id: 'subscription.planCard.discount' },
                                                { amount: formatAmount(discount.discountAmount, price?.currencyCode, intl.locale) }
                                            )}
                                        </Typography.Text>
                                    )}
                                </>
                            )}

                            {isActive && <SubscriptionPaymentErrorAlert subscriptionPlanId={plan.id} />}

                            {hasPaymentMethodForActivePlan && hasPaymentMethod && (
                                <div onClick={stopSelection} role='presentation'>
                                    <Space size={8} direction='vertical'>
                                        <Typography.Link
                                            id={`subscription-plan-card-${plan.id}-payment-history-link`}
                                            onClick={openPaymentHistoryModal}
                                        >
                                            <Space size={4} direction='horizontal' align='center'>
                                                <Bill size='small' />
                                                {PaymentHistoryLinkLabel}
                                            </Space>
                                        </Typography.Link>
                                        <Typography.Link
                                            id={`subscription-plan-card-${plan.id}-linked-cards-link`}
                                            onClick={openLinkedCardsModal}
                                        >
                                            <Space size={4} direction='horizontal' align='center'>
                                                <CreditCard size='small' />
                                                {LinkedCardsLinkLabel}
                                            </Space>
                                        </Typography.Link>
                                    </Space>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </>
    )
}

import {
    GetAvailableSubscriptionPlansQueryResult,
    GetPendingSubscriptionRequestsQueryResult,
    GetOrganizationTrialSubscriptionsQuery,
    GetOrganizationActivatedSubscriptionsQuery,
} from '@app/condo/gql'
import { OrganizationFeature } from '@app/condo/schema'
import { Collapse } from 'antd'
import classnames from 'classnames'
import getConfig from 'next/config'
import React, { useState, useCallback } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { Unlock, Lock, QuestionCircle, ChevronDown } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography, Space, Button, Tooltip, Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { CURRENCY_SYMBOLS } from '@condo/domains/common/constants/currencies'
import { ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID } from '@condo/domains/common/constants/featureflags'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import styles from './SubscriptionPlanCard.module.css'

import type { AvailableFeature } from '@condo/domains/subscription/constants/features'


type PlanType = GetAvailableSubscriptionPlansQueryResult['data']['result']['plans'][number]

const { Panel } = Collapse

type FeatureConfig = {
    featureKey?: AvailableFeature
    label: string
    hint: string | null
}

const BASE_FEATURES = [
    { label: 'subscription.features.profile', hint: null },
    { label: 'subscription.features.notifications', hint: null },
    { label: 'subscription.features.guide', hint: null },
    { label: 'subscription.features.services', hint: null },
    { label: 'subscription.features.settings', hint: null },
    { label: 'subscription.features.analytics', hint: null },
    { featureKey: 'tickets', label: 'subscription.features.tickets', hint: null },
    { label: 'subscription.features.properties', hint: 'subscription.features.properties.hint' },
    { label: 'subscription.features.employees', hint: null },
    { label: 'subscription.features.residents', hint: 'subscription.features.residents.hint' },
    { featureKey: 'meters', label: 'subscription.features.meters', hint: null },
    { featureKey: 'payments', label: 'subscription.features.payments', hint: null },
    { label: 'subscription.features.mobileApp', hint: null },
    { label: 'subscription.features.outages', hint: null },
    { featureKey: 'news', label: 'subscription.features.news', hint: null },
    { featureKey: 'marketplace', label: 'subscription.features.marketplace', hint: null },
    { featureKey: 'support', label: 'subscription.features.personalManager', hint: 'subscription.features.personalManager.hint' },
    { featureKey: 'ai', label: 'subscription.features.ai', hint: null },
] satisfies FeatureConfig[]

const PREMIUM_FEATURES = [
    { featureKey: 'customization', label: 'subscription.features.customization', hint: 'subscription.features.customization.hint' },
] satisfies FeatureConfig[]

const { publicRuntimeConfig: { subscriptionFeatureHelpLinks = {} } } = getConfig()

interface FeatureItemProps {
    label: string
    available: boolean
    helpLink?: string
    hint?: string | null
}

type PendingRequest = GetPendingSubscriptionRequestsQueryResult['data']['pendingRequests'][number]
type TrialContextType = GetOrganizationTrialSubscriptionsQuery['trialSubscriptions'][number]
type ActivatedSubscriptionType = GetOrganizationActivatedSubscriptionsQuery['activatedSubscriptions'][number]

interface SubscriptionPlanCardProps { 
    planInfo: PlanType
    activatedTrial?: TrialContextType
    pendingRequest?: PendingRequest
    activatedSubscriptions: ActivatedSubscriptionType[]
    handleActivatePlan: (params: {
        priceId: string
        isTrial?: boolean
        planName?: string
        trialDays?: number
        isCustomPrice?: boolean
    }) => void
    b2bAppsMap: Map<string, { id: string, name?: string }>
    allB2BAppIds: string[]
    emoji?: string
}

interface SubscriptionPlanBadgeProps {
    plan: PlanType['plan']
    activatedTrial?: TrialContextType
}

const FeatureItem: React.FC<FeatureItemProps> = ({ label, available, helpLink, hint }) => {
    const intl = useIntl()
    const featureLabel = intl.formatMessage({ id: label as FormatjsIntl.Message['ids'] })
    const hintText = hint ? intl.formatMessage({ id: hint as FormatjsIntl.Message['ids'] }) : null

    const icon = available ? <Unlock color={colors.green[5]} size='small' /> : <Lock color={colors.red[5]} size='small' />

    const textContent = helpLink && !available ? (
        <Typography.Link href={helpLink} target='_blank' rel='noopener noreferrer'>
            <Typography.Text type='secondary'>{featureLabel}</Typography.Text>
        </Typography.Link>
    ) : (
        <Typography.Text type='secondary'>{featureLabel}</Typography.Text>
    )

    return (
        <Space size={8} direction='horizontal' align='center'>
            {icon}
            {textContent}
            {hintText && (
                <Tooltip title={hintText}>
                    <span className={styles.hintWrapper}>
                        <QuestionCircle color={colors.gray[7]} size='small' />
                    </span>
                </Tooltip>
            )}
        </Space>
    )
}

const SubscriptionPlanBadge: React.FC<SubscriptionPlanBadgeProps> = ({ plan, activatedTrial }) => {
    const intl = useIntl()
    const { subscriptionContext } = useOrganizationSubscription()

    const activePlanId = subscriptionContext?.subscriptionPlan?.id
    const daysRemaining = subscriptionContext?.daysRemaining
    const isActivePlan = activePlanId === plan?.id
    const isTrialExpired = activatedTrial?.daysRemaining === 0

    let badgeMessage: string | null = null
    let bgColor = colors.gray[7]

    if (isTrialExpired) {
        badgeMessage = intl.formatMessage({ id: 'subscription.planCard.badge.trialExpired' })
    }

    if (isActivePlan) {
        bgColor = colors.green[5]

        if (daysRemaining !== null && daysRemaining <= 30) {
            badgeMessage = intl.formatMessage({ id: 'subscription.planCard.badge.activeDays' }, { days: daysRemaining })

            if (daysRemaining <= 7) bgColor = colors.orange[5]
            if (daysRemaining <= 1) bgColor = colors.red[5]
        } else {
            badgeMessage = intl.formatMessage({ id: 'subscription.planCard.badge.active' })
        }
    }

    if (!badgeMessage) return null

    return (
        <Tag bgColor={bgColor} textColor={colors.white}>
            {badgeMessage}
        </Tag>
    )
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({ planInfo, activatedTrial, pendingRequest, activatedSubscriptions, handleActivatePlan, b2bAppsMap, allB2BAppIds, emoji }) => {
    const intl = useIntl()
    const RequestPendingMessage = intl.formatMessage({ id: 'subscription.planCard.requestPending' })
    const SubmitRequestMessage = intl.formatMessage({ id: 'subscription.planCard.submitRequest' })
    const BuyMessage = intl.formatMessage({ id: 'subscription.planCard.buy' })
    const FeaturesTitle = intl.formatMessage({ id: 'subscription.features.title' })
    const FreeForPartnerMessage = intl.formatMessage({ id: 'subscription.planCard.freeForPartner' })

    const { organization, role } = useOrganization()
    const { useFlagValue } = useFeatureFlags()

    const { plan, prices } = planInfo
    const price = prices?.[0]

    const TryFreeMessage = intl.formatMessage({ id: 'subscription.planCard.tryFree' }, { currency: CURRENCY_SYMBOLS[price?.currencyCode] })
    const PeriodMessage = intl.formatMessage({ id: `subscription.planCard.planPrice.${price?.period}` as FormatjsIntl.Message['ids'] })

    const activeBankingPlanId = useFlagValue(ACTIVE_BANKING_SUBSCRIPTION_PLAN_ID)
    const hasActiveBanking = organization?.features?.includes(OrganizationFeature.ActiveBanking)
    const isActiveBankingPlan = activeBankingPlanId && plan?.id === activeBankingPlanId
    const isCustomPrice = price?.price === null || price?.price === undefined
    const priceInteger = price?.price !== null && price?.price !== undefined ? Math.floor(Number(price.price)) : -1
    const formattedPrice = priceInteger >= 0 ? priceInteger.toLocaleString(intl.locale).replace(/,/g, ' ') : ''
    const isFreeForPartner = hasActiveBanking && isActiveBankingPlan

    const hasActivatedThisPlanOrHigher = activatedSubscriptions.some(
        ctx => ctx.subscriptionPlan && (
            ctx.subscriptionPlan.id === plan.id || 
            ctx.subscriptionPlan.priority > (plan.priority || 0)
        )
    )
    const canActivateTrial = !activatedTrial && plan.trialDays > 0 && !hasActivatedThisPlanOrHigher

    const [activateLoading, setActivateLoading] = useState<boolean>(false)
    const [trialActivateLoading, setTrialActivateLoading] = useState<boolean>(false)

    const handleActivePlanClick = useCallback(async () => {
        if (!price?.id) return

        setActivateLoading(true)
        try {
            await handleActivatePlan({
                priceId: price.id,
                isTrial: false,
                planName: plan.name,
                trialDays: plan.trialDays,
                isCustomPrice,
            })
        } finally {
            setActivateLoading(false)
        }
    }, [handleActivatePlan, price?.id, plan.name, plan.trialDays, isCustomPrice])

    const handleTrialActivateClick = useCallback(async () => {
        if (!price?.id) return

        setTrialActivateLoading(true)
        try {
            await handleActivatePlan({
                priceId: price.id,
                isTrial: true,
                planName: plan.name,
                trialDays: plan.trialDays,
                isCustomPrice,
            })
        } finally {
            setTrialActivateLoading(false)
        }
    }, [handleActivatePlan, price?.id, plan.name, plan.trialDays, isCustomPrice])

    const renderFeature = useCallback(({ featureKey, label, hint }: FeatureConfig) => (
        <FeatureItem 
            key={featureKey || label} 
            label={label} 
            available={!featureKey ? true : (plan as Record<AvailableFeature, boolean>)[featureKey] === true} 
            helpLink={featureKey ? subscriptionFeatureHelpLinks[featureKey] : undefined} 
            hint={hint} 
        />
    ), [plan])

    const hasPendingRequest = !!pendingRequest
    const primaryButtonLabel = hasPendingRequest ? RequestPendingMessage : (isCustomPrice ? SubmitRequestMessage : BuyMessage)
    const canManageSubscriptions = role?.canManageSubscriptions

    const cardClassName = classnames(
        styles.subscriptionPlanCard,
        {
            [styles.subscriptionPlanCardPromoted]: plan.canBePromoted,
        }
    )

    return (
        <Card className={cardClassName}>
            <Space size={24} direction='vertical'>
                <div className={styles.mainContent}>
                    <Space size={60} direction='vertical'>
                        <Space size={12} direction='vertical'>
                            <Space size={4} direction='horizontal' className={styles.header} width='100%'>
                                <Typography.Title level={3}>
                                    {plan.name} {emoji ? emoji : ''}
                                </Typography.Title>
                                <SubscriptionPlanBadge 
                                    plan={plan}
                                    activatedTrial={activatedTrial}
                                />
                            </Space>
                            <div className={styles.description}>
                                <Typography.Paragraph type='secondary'>
                                    {plan.description}
                                </Typography.Paragraph>
                            </div>
                        </Space>
                        <Space size={24} direction='vertical'>
                            <Space size={4} direction='vertical'>
                                <Space size={4} direction='horizontal'>
                                    <Typography.Title level={3}>
                                        {isFreeForPartner ? FreeForPartnerMessage : (isCustomPrice ? price.name : `${formattedPrice} ${CURRENCY_SYMBOLS[price.currencyCode]}`)}
                                    </Typography.Title>
                                    {!isCustomPrice && !isFreeForPartner && (
                                        <Typography.Text type='secondary'>
                                            / {PeriodMessage}
                                        </Typography.Text>
                                    )}
                                </Space>
                            </Space>
                            {!isFreeForPartner && (
                                <div className={styles.buttons}>
                                    <Button
                                        type='primary'
                                        onClick={handleActivePlanClick}
                                        loading={activateLoading}
                                        disabled={hasPendingRequest || !price?.id || !canManageSubscriptions}
                                    >
                                        {primaryButtonLabel}
                                    </Button>
                                    {canActivateTrial && (
                                        <Button
                                            type='accent'
                                            onClick={handleTrialActivateClick} 
                                            loading={trialActivateLoading}
                                            disabled={!canManageSubscriptions}
                                        >
                                            {TryFreeMessage}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Space>
                    </Space>
                </div>
                <Collapse
                    ghost
                    className={styles.collapse}
                    expandIcon={({ isActive }) => (
                        <span className={classnames(styles.collapseIcon, { [styles.collapseIconActive]: isActive })}>
                            <ChevronDown size='small' />
                        </span>
                    )}
                >
                    <Panel
                        header={<Typography.Text strong>{FeaturesTitle}</Typography.Text>}
                        key='features'
                    >
                        <Space direction='vertical' size={8}>
                            {BASE_FEATURES.map(renderFeature)}
                            {allB2BAppIds.map((appId) => {
                                const app = b2bAppsMap.get(appId)
                                if (!app || !app.name) return null

                                const enabledApps = plan.enabledB2BApps || []
                                const isAvailable = enabledApps.includes(appId)

                                return (
                                    <FeatureItem
                                        key={appId}
                                        label={app.name}
                                        available={isAvailable}
                                        helpLink={subscriptionFeatureHelpLinks[appId]}
                                    />
                                )
                            })}
                            {PREMIUM_FEATURES.map(renderFeature)}
                        </Space>
                    </Panel>
                </Collapse>
            </Space>
        </Card>
    )
}
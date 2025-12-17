import { LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { GetAvailableSubscriptionPlansQueryResult, useActivateSubscriptionPlanMutation } from '@app/condo/gql'
import { Collapse } from 'antd'
import classnames from 'classnames'
import React, { useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography, Space, Button, Tag } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { CURRENCY_SYMBOLS } from '@condo/domains/common/constants/currencies'
import { FEATURE_KEY } from '@condo/domains/subscription/constants/features'
import { useGetOrganizationTrialSubscriptionsQuery } from '@condo/domains/subscription/gql'

import styles from './SubscriptionPlanCard.module.css'


type PlanType = GetAvailableSubscriptionPlansQueryResult['data']['result']['plans'][number]

const { Panel } = Collapse

// Base features available in all plans
const BASE_FEATURES = [
    'subscription.features.profile',
    'subscription.features.notifications',
    'subscription.features.guide',
    'subscription.features.services',
    'subscription.features.settings',
    'subscription.features.analytics',
    'subscription.features.tickets',
    'subscription.features.properties',
    'subscription.features.employees',
    'subscription.features.residents',
    'subscription.features.meters',
    'subscription.features.payments',
    'subscription.features.mobileApp',
    'subscription.features.outages',
]

// Premium features that need backend checks
const PREMIUM_FEATURES = [
    { key: FEATURE_KEY.NEWS, label: 'subscription.features.news' },
    { key: FEATURE_KEY.MARKETPLACE, label: 'subscription.features.marketplace' },
    { key: FEATURE_KEY.SUPPORT, label: 'subscription.features.personalManager' },
    { key: FEATURE_KEY.AI, label: 'subscription.features.ai' },
    { key: FEATURE_KEY.PASS_TICKETS, label: 'subscription.features.passTickets' },
]

interface FeatureItemProps {
    label: string
    available: boolean
}

type ActivatedTrial = ReturnType<typeof useGetOrganizationTrialSubscriptionsQuery>['data']['trialSubscriptions']['number']

interface SubscriptionPlanCardProps {
    planInfo: PlanType
    activatedTrial?: ActivatedTrial
    handleActivatePlan: (priceId: string, isTrial: boolean) => void
}

interface SubscriptionPlanBadgeProps {
    plan: PlanType['plan']
    activatedTrial?: ActivatedTrial
}

const FeatureItem: React.FC<FeatureItemProps> = ({ label, available }) => {
    const intl = useIntl()
    const featureLabel = intl.formatMessage({ id: label as FormatjsIntl.Message['ids'] })
    
    return (
        <Space size={8} direction='horizontal'>
            {available ? (
                <UnlockOutlined style={{ color: colors.green[5], fontSize: 16 }} />
            ) : (
                <LockOutlined style={{ color: colors.red[5], fontSize: 16 }} />
            )}
            <Typography.Text type={available ? undefined : 'secondary'}>
                {featureLabel}
            </Typography.Text>
        </Space>
    )
}

const SubscriptionPlanBadge: React.FC<SubscriptionPlanBadgeProps> = ({ plan, activatedTrial }) => {
    const intl = useIntl()
    const ActiveMessage = intl.formatMessage({ id: 'subscription.planCard.badge.active' })
    const TrialExpiredMessage = intl.formatMessage({ id: 'subscription.planCard.badge.trialExpired' })

    // TODO: DOMA-12733 Check non active by contexts
    // const NonActiveMessage = intl.formatMessage({ id: 'subscription.planCard.badge.notActive' })

    const { organization } = useOrganization()
    const activePlanId = organization?.subscription?.subscriptionPlan?.id
    const daysRemaining = organization?.subscription?.daysRemaining

    let badgeMessage
    let bgColor = colors.gray[7]

    if (activatedTrial && activatedTrial.daysRemaining === 0) {
        badgeMessage = TrialExpiredMessage
    }

    if (activePlanId === plan?.id) {
        bgColor = colors.green[5]
         
        if (daysRemaining !== null && daysRemaining < 30) {
            badgeMessage = intl.formatMessage({ id: 'subscription.planCard.badge.activeDays' }, { days: daysRemaining })
          
            if (daysRemaining < 7) {
                bgColor = colors.orange[5]
            }
            if (daysRemaining < 2) {
                bgColor = colors.red[5]
            }
        } else {
            badgeMessage = ActiveMessage
        }
    }

    if (!badgeMessage) {
        return null
    }
    
    return (
        <Tag bgColor={bgColor} textColor={colors.white}>
            {badgeMessage}
        </Tag>
    )
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({ planInfo, activatedTrial, handleActivatePlan }) => {
    const intl = useIntl()

    const { plan, prices } = planInfo
    const price = prices?.[0]
    const isCustomPrice = !price?.price

    const [activateLoading, setActivateLoading] = useState<boolean>(false)
    const [trialActivateLoading, setTrialActivateLoading] = useState<boolean>(false)

    const handleActivePlanClick = async () => {
        setActivateLoading(true)
        await handleActivatePlan(price.id, false)
        setActivateLoading(false)
    }

    const handleTrialActivateClick = async () => {
        setTrialActivateLoading(true)
        await handleActivatePlan(price.id, true)
        setTrialActivateLoading(false)
    }

    const cardClassName = classnames(
        styles['subscription-plan-card'],
        {
            [styles['subscription-plan-card-promoted']]: plan.canBePromoted,
        }
    )

    return (
        <Card className={cardClassName}>
            <div className={styles['main-content']}>
                <Space size={60} direction='vertical'>
                    <Space size={12} direction='vertical'>
                        <Space size={4} direction='horizontal' className={styles.header} width='100%'>
                            <Typography.Title level={3}>
                                {plan.name}
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
                        <Space size={4} direction='horizontal'>
                            <Typography.Title level={3}>
                                {isCustomPrice ? price.name : `${price.price} ${CURRENCY_SYMBOLS[price.currencyCode]}`}
                            </Typography.Title>
                            {
                                !isCustomPrice && (
                                    <Typography.Text type='secondary'>
                                        {intl.formatMessage({ id: `subscription.planCard.planPrice.${price.period}` })}
                                    </Typography.Text> 
                                )
                            }
                        </Space>
                        <div className={styles.buttons}>
                            <Button type='primary' onClick={handleActivePlanClick} loading={activateLoading}>
                                {isCustomPrice ? 'Оставить заявку' : 'Купить'}
                            </Button>
                            {
                                !activatedTrial && plan.trialDays > 0 && (
                                    <Button type='secondary' onClick={handleTrialActivateClick} loading={trialActivateLoading}>
                                        {`Попробовать за 0${CURRENCY_SYMBOLS[price.currencyCode]}`}
                                    </Button>
                                )
                            }
                        </div>
                    </Space>
                </Space>
            </div>
            <Collapse ghost>
                <Panel
                    header={
                        <Typography.Text strong>
                            {intl.formatMessage({ id: 'subscription.features.title' })}
                        </Typography.Text>
                    }
                    key='features'
                >
                    <Space direction='vertical' size={8}>
                        {BASE_FEATURES.map((label) => (
                            <FeatureItem key={label} label={label} available />
                        ))}
                        {PREMIUM_FEATURES.map(({ key, label }) => (
                            <FeatureItem key={key} label={label} available={plan[key] === true} />
                        ))}
                    </Space>
                </Panel>
            </Collapse>
        </Card>
    )
}
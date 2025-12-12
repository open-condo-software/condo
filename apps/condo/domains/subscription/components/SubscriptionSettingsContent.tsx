import { LockOutlined, UnlockOutlined, CrownOutlined } from '@ant-design/icons'
import { Collapse, notification, Row, Col } from 'antd'
import React, { useState, useMemo } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography, Space, Button, Tag, Radio } from '@open-condo/ui'

import { FEATURE_KEY } from '@condo/domains/subscription/constants/features'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import { useGetAvailableSubscriptionPlansQuery, useActivateSubscriptionPlanMutation, useGetOrganizationTrialSubscriptionsQuery } from '../../../gql'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse

type BillingPeriod = 'monthly' | 'yearly'

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
]

// Special plan only features
const SPECIAL_FEATURES = [
    'subscription.features.customization',
]

interface FeatureItemProps {
    label: string
    available: boolean
}

const FeatureItem: React.FC<FeatureItemProps> = ({ label, available }) => {
    const intl = useIntl()
    const featureLabel = intl.formatMessage({ id: label })
    
    return (
        <Space size={8}>
            {available ? (
                <UnlockOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            ) : (
                <LockOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
            )}
            <Text type={available ? undefined : 'secondary'}>
                {featureLabel}
            </Text>
        </Space>
    )
}

export const SubscriptionSettingsContent: React.FC = () => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { user } = useAuth()
    const { subscription, isExpired, refetch: refetchSubscription } = useOrganizationSubscription()

    const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
    const [activatingPlan, setActivatingPlan] = useState<string | null>(null)

    const isTrial = subscription?.isTrial
    const daysRemaining = subscription?.daysRemaining

    // Load available plans from server
    const { data: plansData, loading: plansLoading, refetch: refetchPlans } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id,
    })

    const availablePlans = plansData?.result?.plans || []

    // Load trial subscriptions history
    const { data: trialSubscriptionsData, refetch: refetchTrialSubscriptions } = useGetOrganizationTrialSubscriptionsQuery({
        variables: {
            organizationId: organization?.id,
        },
        skip: !organization?.id,
    })

    const trialSubscriptions = trialSubscriptionsData?.trialSubscriptions || []

    const [activateSubscriptionPlan] = useActivateSubscriptionPlanMutation()

    // Sort plans by priority (ascending)
    const sortedPlans = useMemo(() => {
        return [...availablePlans].sort((a, b) => {
            const priorityA = a.plan.priority ?? 999
            const priorityB = b.plan.priority ?? 999
            return priorityA - priorityB
        })
    }, [availablePlans])

    const handleActivateTrial = async (planId: string, isTrial: boolean = true) => {
        if (!organization) return

        setActivatingPlan(planId)
        try {
            const result = await activateSubscriptionPlan({
                variables: {
                    data: {
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'subscription-settings' },
                        organization: { id: organization.id },
                        subscriptionPlan: { id: planId },
                        isTrial,
                    },
                },
            })

            if (result.data?.result?.subscriptionContext) {
                await refetchSubscription()
                await refetchPlans()
                
                if (isTrial) {
                    await refetchTrialSubscriptions()
                }
                
                notification.success({
                    message: intl.formatMessage({ id: 'subscription.activation.success' }),
                    description: isTrial 
                        ? intl.formatMessage(
                            { id: 'subscription.activation.trialSuccess' },
                            { days: result.data.result.subscriptionContext.subscriptionPlan.trialDays }
                        )
                        : intl.formatMessage({ id: 'subscription.activation.paidSuccess' }),
                    duration: 5,
                })
            } else if (!isTrial) {
                notification.success({
                    message: intl.formatMessage({ id: 'subscription.activation.requestSent' }),
                    description: intl.formatMessage({ id: 'subscription.activation.requestSentDescription' }),
                    duration: 5,
                })
            }
        } catch (error) {
            console.error('Failed to activate subscription:', error)
            
            const errorMessage = error?.message || intl.formatMessage({ id: 'subscription.activation.error' })
            notification.error({
                message: intl.formatMessage({ id: 'subscription.activation.errorTitle' }),
                description: errorMessage,
                duration: 5,
            })
        } finally {
            setActivatingPlan(null)
        }
    }

    const isFeatureAvailable = (planId: string, featureKey: string): boolean => {
        const planData = availablePlans.find(p => p.plan.id === planId)
        if (!planData) return false
        return planData.plan[featureKey] === true
    }

    const isSpecialPlan = (planId: string): boolean => {
        const planData = availablePlans.find(p => p.plan.id === planId)
        // Assuming special plan has the highest priority or specific marker
        return planData?.plan.priority === 1
    }

    // Get subscription status color and text for a specific plan
    const getPlanSubscriptionStatus = (planId: string) => {
        if (!subscription || subscription.subscriptionPlan.id !== planId) {
            return null
        }

        if (isExpired) {
            if (isTrial) {
                return {
                    color: 'default',
                    text: intl.formatMessage({ id: 'subscription.status.trialExpired' }),
                }
            }
            return {
                color: 'default',
                text: intl.formatMessage({ id: 'subscription.status.notActive' }),
            }
        }

        if (isTrial && daysRemaining !== undefined) {
            if (daysRemaining === 1) {
                return {
                    color: 'red',
                    text: intl.formatMessage({ id: 'subscription.status.daysRemaining.one' }, { days: daysRemaining }),
                }
            } else if (daysRemaining <= 7) {
                return {
                    color: 'orange',
                    text: intl.formatMessage({ id: 'subscription.status.daysRemaining.few' }, { days: daysRemaining }),
                }
            } else {
                return {
                    color: 'green',
                    text: intl.formatMessage({ id: 'subscription.status.daysRemaining.many' }, { days: daysRemaining }),
                }
            }
        }

        return {
            color: 'green',
            text: intl.formatMessage({ id: 'subscription.status.active' }),
        }
    }

    if (plansLoading) {
        return (
            <Space direction='vertical' size={16}>
                <Text>{intl.formatMessage({ id: 'subscription.loading' })}</Text>
            </Space>
        )
    }

    return (
        <Space direction='vertical' size={24}>
            {/* Billing period toggle */}
            <div style={{ textAlign: 'center' }}>
                <Radio.Group

                    value={billingPeriod}
                    onChange={(e) => setBillingPeriod(e.target.value as BillingPeriod)}
                >
                    <Radio value='monthly'>{intl.formatMessage({ id: 'subscription.period.monthly' })}</Radio>
                    <Radio value='yearly'>{intl.formatMessage({ id: 'subscription.period.yearly' })}</Radio>
                </Radio.Group>
            </div>

            {/* Plans grid */}
            <Row gutter={[24, 24]}>
                {sortedPlans.map((availablePlan) => {
                    const { plan, prices } = availablePlan
                    const selectedPrice = prices.find(p => p.period === billingPeriod)
                    const isCurrentPlan = subscription?.subscriptionPlan.id === plan.id
                    const isExtended = plan.priority === 1
                    const isPremium = isSpecialPlan(plan.id)
                    
                    const trialAlreadyActivated = trialSubscriptions.some(
                        trial => trial.subscriptionPlan.id === plan.id
                    )

                    // Get status for this plan if it's the current one
                    const planStatus = getPlanSubscriptionStatus(plan.id)

                    // Prepare features list
                    const allFeatures = [
                        ...BASE_FEATURES.map(label => ({ label, available: true })),
                        ...PREMIUM_FEATURES.map(({ key, label }) => ({
                            label,
                            available: isFeatureAvailable(plan.id, key),
                        })),
                        ...SPECIAL_FEATURES.map(label => ({
                            label,
                            available: isPremium,
                        })),
                    ]

                    return (
                        <Col key={plan.id}>
                            <Card
                                hoverable
                                style={{
                                    height: '100%',
                                    border: isExtended ? '2px solid #1890ff' : undefined,
                                }}
                            >
                                <Space direction='vertical' size={16}>
                                    {/* Header */}
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Space size={8}>
                                                <Title level={4}>
                                                    {plan.name}
                                                </Title>
                                                {isExtended && (
                                                    <CrownOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                                                )}
                                            </Space>
                                            {planStatus && (
                                                <Tag color={planStatus.color} style={{ marginTop: 4 }}>
                                                    {planStatus.text}
                                                </Tag>
                                            )}
                                        </div>
                                        {plan.description && (
                                            <Paragraph type='secondary'>
                                                {plan.description}
                                            </Paragraph>
                                        )}
                                    </div>

                                    {/* Price */}
                                    {selectedPrice && (
                                        <div>
                                            <Title level={3}>
                                                {parseFloat(selectedPrice.price).toLocaleString('ru-RU', { maximumFractionDigits: 2 })}{' '}
                                                {selectedPrice.currencyCode === 'RUB' ? '₽' : selectedPrice.currencyCode}
                                            </Title>
                                            <Text type='secondary'>
                                                {billingPeriod === 'monthly' 
                                                    ? intl.formatMessage({ id: 'subscription.price.perMonth' })
                                                    : intl.formatMessage({ id: 'subscription.price.perYear' })
                                                }
                                            </Text>
                                        </div>
                                    )}

                                    {/* Action button */}
                                    {isCurrentPlan ? (
                                        <Button block disabled type='accent'>
                                            {intl.formatMessage({ id: 'subscription.currentPlan' })}
                                        </Button>
                                    ) : trialAlreadyActivated ? (
                                        <Space direction='vertical' size={8}>
                                            <Button
                                                type={isExtended ? 'primary' : 'secondary'}
                                                block
                                                disabled
                                            >
                                                {intl.formatMessage({ id: 'subscription.trialActivated' })}
                                            </Button>
                                            <Text type='secondary' size='small'>
                                                {intl.formatMessage({ id: 'subscription.trialUsed' })}
                                            </Text>
                                        </Space>
                                    ) : plan.trialDays ? (
                                        <Button
                                            type={isExtended ? 'primary' : 'secondary'}
                                            block
                                            loading={activatingPlan === plan.id}
                                            onClick={() => handleActivateTrial(plan.id, true)}
                                        >
                                            {intl.formatMessage(
                                                { id: 'subscription.tryFree' },
                                                { days: plan.trialDays }
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            type={isExtended ? 'primary' : 'secondary'}
                                            block
                                            loading={activatingPlan === plan.id}
                                            onClick={() => handleActivateTrial(plan.id, false)}
                                        >
                                            {intl.formatMessage({ id: 'subscription.selectPlan' })}
                                        </Button>
                                    )}

                                    {/* Features collapse */}
                                    <Collapse
                                        ghost
                                        expandIconPosition='end'
                                        style={{ width: '100%' }}
                                    >
                                        <Panel
                                            header={
                                                <Text strong>
                                                    {intl.formatMessage({ id: 'subscription.features.title' })}
                                                </Text>
                                            }
                                            key='features'
                                        >
                                            <Space direction='vertical' size={8}>
                                                {allFeatures.map((feature, index) => (
                                                    <FeatureItem
                                                        key={index}
                                                        label={feature.label}
                                                        available={feature.available}
                                                    />
                                                ))}
                                            </Space>
                                        </Panel>
                                    </Collapse>
                                </Space>
                            </Card>
                        </Col>
                    )
                })}
            </Row>
        </Space>
    )
}

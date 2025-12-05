
import { CheckOutlined, CrownOutlined } from '@ant-design/icons'
import { Row, Col, Divider, notification } from 'antd'
import Head from 'next/head'
import React, { useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography, Space, Button, Tag } from '@open-condo/ui'

import { PageContent, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { SubscriptionBadge } from '@condo/domains/subscription/components/SubscriptionBadge'
import { TrialCountdown } from '@condo/domains/subscription/components/TrialCountdown'
import { FEATURE_KEY } from '@condo/domains/subscription/constants/features'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import { useGetAvailableSubscriptionPlansQuery, useActivateSubscriptionPlanMutation, useGetOrganizationTrialSubscriptionsQuery } from '../../gql'

const { Title, Paragraph, Text } = Typography

const FEATURE_NAMES: Record<string, string> = {
    [FEATURE_KEY.NEWS]: 'Новости',
    [FEATURE_KEY.MARKETPLACE]: 'Маркетплейс',
    [FEATURE_KEY.SUPPORT]: 'Поддержка',
    [FEATURE_KEY.AI]: 'AI Ассистент',
    [FEATURE_KEY.PASS_TICKETS]: 'Пропуска',
}

const SubscriptionPage: React.FC = () => {
    const intl = useIntl()
    const { organization } = useOrganization()
    const { user } = useAuth()
    const { subscription, isExpired, refetch: refetchSubscription } = useOrganizationSubscription()

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

    const [activatingPlan, setActivatingPlan] = useState<string | null>(null)
    const [activateSubscriptionPlan] = useActivateSubscriptionPlanMutation()

    const handleActivateTrial = async (planId: string, isTrial: boolean = true) => {
        if (!organization) return

        setActivatingPlan(planId)
        try {
            const result = await activateSubscriptionPlan({
                variables: {
                    data: {
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'subscription-page' },
                        organization: { id: organization.id },
                        subscriptionPlan: { id: planId },
                        isTrial,
                    },
                },
            })

            if (result.data?.result?.subscriptionContext) {
                // Refetch subscription data
                await refetchSubscription()
                await refetchPlans()
                
                // Refetch trial subscriptions if it was a trial activation
                if (isTrial) {
                    await refetchTrialSubscriptions()
                }
                
                notification.success({
                    message: 'Подписка активирована',
                    description: isTrial 
                        ? `Пробный период на ${result.data.result.subscriptionContext.subscriptionPlan.trialDays} дней успешно активирован`
                        : 'Подписка успешно активирована',
                    duration: 5,
                })
            } else if (!isTrial) {
                // For paid subscription, show success message
                notification.success({
                    message: 'Запрос отправлен',
                    description: 'Запрос на активацию подписки отправлен. Мы свяжемся с вами в ближайшее время.',
                    duration: 5,
                })
            }
        } catch (error) {
            console.error('Failed to activate subscription:', error)
            
            const errorMessage = error?.message || 'Не удалось активировать подписку'
            notification.error({
                message: 'Ошибка активации',
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

        // Check if feature is enabled in the plan
        return planData.plan[featureKey] === true
    }

    if (plansLoading) {
        return (
            <>
                <Head>
                    <title>Тарифные планы</title>
                </Head>
                <PageWrapper>
                    <PageContent>
                        <Space direction='vertical' size={16}>
                            <Text>Загрузка тарифных планов...</Text>
                        </Space>
                    </PageContent>
                </PageWrapper>
            </>
        )
    }

    return (
        <>
            <Head>
                <title>Тарифные планы</title>
            </Head>
            <PageWrapper>
                <PageContent>
                    <Space direction='vertical' size={16}>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <Title level={2}>Тарифные планы</Title>
                            <Paragraph type='secondary'>
                                Выберите подходящий тариф для вашей организации
                            </Paragraph>
                        </div>

                        {subscription && (
                            <Card>
                                <Space direction='vertical' size={8} >
                                    <Text strong>Текущая подписка:</Text>
                                    <Space size={8}>
                                        <SubscriptionBadge
                                            type={subscription.subscriptionPlan.name}
                                            isTrial={isTrial}
                                        />
                                        {isTrial && daysRemaining > 0 && (
                                            <TrialCountdown daysRemaining={daysRemaining} />
                                        )}
                                        {isExpired && (
                                            <Tag color='red'>Подписка истекла</Tag>
                                        )}
                                    </Space>
                                    <Text type='secondary'>
                                        {subscription.subscriptionPlan.name}
                                    </Text>
                                </Space>
                            </Card>
                        )}

                        <Row gutter={[24, 24]}>
                            {availablePlans.map((availablePlan) => {
                                const { plan, prices } = availablePlan
                                console.log(prices)
                                const monthlyPrice = prices.find(p => p.period === 'monthly')
                                const yearlyPrice = prices.find(p => p.period === 'yearly')
                                const isCurrentPlan = subscription?.subscriptionPlan.id === plan.id
                                const isExtended = plan.priority === 1
                                
                                // Check if trial was already activated for this plan
                                const trialAlreadyActivated = trialSubscriptions.some(
                                    trial => trial.subscriptionPlan.id === plan.id
                                )

                                return (
                                    <Col xs={24} key={plan.id}>
                                        <Card
                                            hoverable
                                            style={{
                                                height: '100%',
                                                border: isExtended ? '2px solid #1890ff' : undefined,
                                            }}
                                        >
                                            <Space direction='vertical' size={8}>
                                                <div>
                                                    <Space size={8}>
                                                        <Title level={4} >
                                                            {plan.name}
                                                        </Title>
                                                        {isExtended && (
                                                            <CrownOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                                                        )}
                                                    </Space>
                                                    {plan.description && (
                                                        <Paragraph type='secondary' >
                                                            {plan.description}
                                                        </Paragraph>
                                                    )}
                                                </div>

                                                {monthlyPrice && (
                                                    <div>
                                                        <Title level={3} >
                                                            {parseFloat(monthlyPrice.price).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {monthlyPrice.currencyCode === 'RUB' ? '₽' : monthlyPrice.currencyCode}
                                                        </Title>
                                                        <Text type='secondary'>в месяц</Text>
                                                        {yearlyPrice && (
                                                            <div style={{ marginTop: 8 }}>
                                                                <Text type='secondary'>
                                                                    или {parseFloat(yearlyPrice.price).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {yearlyPrice.currencyCode === 'RUB' ? '₽' : yearlyPrice.currencyCode} в год
                                                                </Text>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <Divider style={{ margin: '12px 0' }} />

                                                <Space direction='vertical' size={8}>
                                                    {Object.entries(FEATURE_NAMES).map(([key, name]) => {
                                                        const available = isFeatureAvailable(plan.id, key)
                                                        return (
                                                            <Space key={key} size={8}>
                                                                <CheckOutlined
                                                                    style={{
                                                                        color: available ? '#52c41a' : '#d9d9d9',
                                                                    }}
                                                                />
                                                                <Text
                                                                    type={available ? undefined : 'secondary'}
                                                                    delete={!available}
                                                                >
                                                                    {name}
                                                                </Text>
                                                            </Space>
                                                        )
                                                    })}
                                                </Space>

                                                <Divider style={{ margin: '12px 0' }} />

                                                {isCurrentPlan ? (
                                                    <Button block disabled type='accent'>
                                                        Текущий тариф
                                                    </Button>
                                                ) : trialAlreadyActivated ? (
                                                    <Space direction='vertical' size={8} style={{ width: '100%' }}>
                                                        <Button
                                                            type={isExtended ? 'primary' : 'secondary'}
                                                            block
                                                            disabled
                                                        >
                                                            Триал уже активирован
                                                        </Button>
                                                        <Text type='secondary' size='small' style={{ textAlign: 'center', display: 'block' }}>
                                                            Пробный период для этого тарифа был использован
                                                        </Text>
                                                    </Space>
                                                ) : plan.trialDays ? (
                                                    <Button
                                                        type={isExtended ? 'primary' : 'secondary'}
                                                        block
                                                        loading={activatingPlan === plan.id}
                                                        onClick={() => handleActivateTrial(plan.id, true)}
                                                    >
                                                        Попробовать бесплатно ({plan.trialDays} дней)
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type={isExtended ? 'primary' : 'secondary'}
                                                        block
                                                        loading={activatingPlan === plan.id}
                                                        onClick={() => handleActivateTrial(plan.id, false)}
                                                    >
                                                        Выбрать тариф
                                                    </Button>
                                                )}
                                            </Space>
                                        </Card>
                                    </Col>
                                )
                            })}
                        </Row>

                        <Card style={{ marginTop: 24, background: '#fafafa' }}>
                            <Space direction='vertical' size={8}>
                                <Text strong>Нужна помощь с выбором тарифа?</Text>
                                <Text type='secondary'>
                                    Свяжитесь с нашей службой поддержки, и мы поможем подобрать оптимальный план для вашей организации.
                                </Text>
                                <Button type='secondary' compact minimal>
                                    Связаться с поддержкой
                                </Button>
                            </Space>
                        </Card>
                    </Space>
                </PageContent>
            </PageWrapper>
        </>
    )
}

export default SubscriptionPage

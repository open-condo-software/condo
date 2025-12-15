import { useGetAvailableSubscriptionPlansQuery, GetAvailableSubscriptionPlansQueryResult, useGetOrganizationTrialSubscriptionsQuery, useActivateSubscriptionPlanMutation } from '@app/condo/gql'
import { notification } from 'antd'
import React, { useState, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography, Space, Radio } from '@open-condo/ui'

import { SubscriptionPlanCard } from './SubscriptionPlanCard/SubscriptionPlanCard'
import styles from './SubscriptionSettingsContent.module.css'

import { Loader } from '../../../common/components/Loader'


type PlanPeriod = 'month' | 'year' // TODO: do as type from SubscriptionPlanPricingRule
type PlanType = GetAvailableSubscriptionPlansQueryResult['data']['result']['plans'][number]

const PromoBanner: React.FC = () => {
    return (
        <Card title='Promo Banner'>
            <Typography.Paragraph>
                Promo banner content
            </Typography.Paragraph>
        </Card>
    )
}

export const SubscriptionSettingsContent: React.FC = () => {
    const intl = useIntl()
    const { organization } = useOrganization()

    const [planPeriod, setPlanPeriod] = useState<PlanPeriod>('year')

    const { data: plansData, loading: plansLoading } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id,
    })

    const availablePlans = useMemo(() => {
        const plans = plansData?.result?.plans ?? []

        return plans
            .map((p) => ({
                plan: p?.plan,
                prices: p?.prices?.filter((price) => price.period === planPeriod),
            }))
            .filter((p) => p?.prices?.length > 0)
            .sort((a, b) => (a.plan?.priority ?? 0) - (b.plan?.priority ?? 0))
    }, [plansData, planPeriod])

    const {
        data: trialSubscriptionsData,
        loading: trialSubscriptionsLoading,
        refetch: refetchTrialSubscriptions, 
    } = useGetOrganizationTrialSubscriptionsQuery({
        variables: {
            organizationId: organization?.id,
        },
        skip: !organization?.id,
    })
    const trialSubscriptions = trialSubscriptionsData?.trialSubscriptions || []

    const [activateSubscriptionPlan] = useActivateSubscriptionPlanMutation()

    const handleActivatePlan = async (priceId: string, isTrial: boolean = true) => {
        if (!organization) return

        try {
            const result = await activateSubscriptionPlan({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organization: { id: organization.id },
                        pricingRule: { id: priceId },
                        isTrial,
                    },
                },
            })

            if (isTrial) {
                await refetchTrialSubscriptions()
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
            } else {
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
        }
    }
    

    if (plansLoading || trialSubscriptionsLoading) {
        return <Loader />
    }

    return (
        <Space size={40} direction='vertical' width='100%'>
            <PromoBanner />
            <Space size={0} direction='vertical' align='center' width='100%'>
                <Radio.Group
                    optionType='button'
                    value={planPeriod}
                    onChange={(e) => setPlanPeriod(e.target.value as PlanPeriod)}
                >
                    <Radio value='year' label={intl.formatMessage({ id: 'subscription.period.yearly' })} />
                    <Radio value='month' label={intl.formatMessage({ id: 'subscription.period.monthly' })} />
                </Radio.Group>
            </Space>
            <div className={styles['plan-list']}>
                {availablePlans.map((planInfo: PlanType) => {
                    const activatedTrial = trialSubscriptions.find(
                        trial => trial.subscriptionPlan.id === planInfo?.plan?.id
                    )

                    return (
                        <SubscriptionPlanCard 
                            key={planInfo?.plan?.id}
                            planInfo={planInfo}
                            handleActivatePlan={handleActivatePlan}
                            activatedTrial={activatedTrial}
                        />
                    )
                })}
            </div>
        </Space>
    )
}

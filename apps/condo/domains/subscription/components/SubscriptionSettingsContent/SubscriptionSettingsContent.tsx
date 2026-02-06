import { useGetAvailableSubscriptionPlansQuery, GetAvailableSubscriptionPlansQueryResult, useGetOrganizationTrialSubscriptionsQuery, useActivateSubscriptionPlanMutation, useGetPendingSubscriptionRequestsQuery, useGetB2BAppsByIdsQuery, useGetOrganizationActivatedSubscriptionsQuery } from '@app/condo/gql'
import { notification } from 'antd'
import dayjs from 'dayjs'
import React, { useState, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Radio, Typography } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'

import { PromoBanner } from './PromoBanner/PromoBanner'
import { SubscriptionPlanCard } from './SubscriptionPlanCard/SubscriptionPlanCard'
import styles from './SubscriptionSettingsContent.module.css'


type PlanPeriod = 'month' | 'year'
type PlanType = GetAvailableSubscriptionPlansQueryResult['data']['result']['plans'][number]

const PLAN_CARD_EMOJIS = ['🏠', '🚀', '👑']

export const SubscriptionSettingsContent: React.FC = () => {
    const intl = useIntl()
    const { organization, employee, selectEmployee } = useOrganization()

    const YearlyLabel = intl.formatMessage({ id: 'subscription.period.yearly' })
    const MonthlyLabel = intl.formatMessage({ id: 'subscription.period.monthly' })
    const ActivationErrorTitle = intl.formatMessage({ id: 'subscription.activation.errorTitle' })
    const ActivationErrorMessage = intl.formatMessage({ id: 'subscription.activation.error' })

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

    const allB2BAppIds = useMemo(() => {
        const plans = plansData?.result?.plans ?? []
        const appIdsSet = new Set<string>()

        plans.forEach(p => {
            const enabledApps = p?.plan?.enabledB2BApps || []
            enabledApps.forEach(appId => appIdsSet.add(appId))
        })

        return Array.from(appIdsSet)
    }, [plansData])

    const { data: b2bAppsData } = useGetB2BAppsByIdsQuery({
        variables: { ids: allB2BAppIds },
        skip: allB2BAppIds.length === 0,
    })

    const b2bAppsMap = useMemo(() => {
        const apps = b2bAppsData?.b2bApps || []
        return new Map(apps.map(app => [app.id, app]))
    }, [b2bAppsData])

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

    const { data: pendingRequestsData, loading: pendingRequestsLoading, refetch: refetchPendingRequests } = useGetPendingSubscriptionRequestsQuery({
        variables: { organizationId: organization?.id },
        skip: !organization?.id,
    })

    const { data: activatedSubscriptionsData, loading: activatedSubscriptionsLoading, refetch: refetchActivatedSubscriptions } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: { 
            organizationId: organization?.id || '',
        },
        skip: !organization?.id,
    })

    const trialSubscriptions = trialSubscriptionsData?.trialSubscriptions || []
    const pendingRequests = pendingRequestsData?.pendingRequests || []
    const activatedSubscriptions = activatedSubscriptionsData?.activatedSubscriptions || []

    const [activateSubscriptionPlan] = useActivateSubscriptionPlanMutation()

    const handleActivatePlan = async ({ priceId, isTrial = true, planName = '', trialDays = 0, isCustomPrice = false }: {
        priceId: string
        isTrial?: boolean
        planName?: string
        trialDays?: number
        isCustomPrice?: boolean
    }) => {
        if (!organization) return

        try {
            await activateSubscriptionPlan({
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
                await refetchPendingRequests()
                await refetchActivatedSubscriptions()
                if (employee?.id) {
                    await selectEmployee(employee.id)
                }
                notification.success({
                    message: (
                        <Typography.Text strong size='large'>
                            {intl.formatMessage({ id: 'subscription.activation.trial.title' }, { planName })}
                        </Typography.Text>
                    ),
                    description: intl.formatMessage({ id: 'subscription.activation.trial.description' }, { planName, days: trialDays }),
                    duration: 5,
                })
            } else {
                await refetchPendingRequests()
                if (isCustomPrice) {
                    notification.success({
                        message: (
                            <Typography.Text strong size='large'>
                                {intl.formatMessage({ id: 'subscription.activation.paid.custom.title' }, { planName })}
                            </Typography.Text>
                        ),
                        description: intl.formatMessage({ id: 'subscription.activation.paid.custom.description' }),
                        duration: 5,
                    })
                } else {
                    notification.success({
                        message: (
                            <Typography.Text strong size='large'>
                                {intl.formatMessage({ id: 'subscription.activation.paid.standard.title' })}
                            </Typography.Text>
                        ),
                        description: intl.formatMessage({ id: 'subscription.activation.paid.standard.description' }),
                        duration: 5,
                    })
                }
            }
        } catch (error) {
            console.error('Failed to activate subscription:', error)
            notification.error({
                message: ActivationErrorTitle,
                description: error?.message || ActivationErrorMessage,
                duration: 5,
            })
        }
    }
    

    const isLoading = plansLoading || trialSubscriptionsLoading || pendingRequestsLoading || activatedSubscriptionsLoading
    if (isLoading) return <Loader />

    return (
        <Space size={40} direction='vertical' width='100%'>
            <PromoBanner />
            <Space size={0} direction='vertical' align='center' width='100%'>
                <Radio.Group
                    optionType='button'
                    value={planPeriod}
                    onChange={(e) => setPlanPeriod(e.target.value as PlanPeriod)}
                >
                    <Radio value='year' label={YearlyLabel} />
                    <Radio value='month' label={MonthlyLabel} />
                </Radio.Group>
            </Space>
            <div className={styles['plan-list']}>
                {availablePlans.map((planInfo: PlanType, index) => {
                    const activatedTrial = trialSubscriptions?.find(
                        trial => trial.subscriptionPlan?.id === planInfo?.plan?.id
                    )
                    const pendingRequest = pendingRequests?.find(
                        request => request.subscriptionPlanPricingRule?.subscriptionPlan?.id === planInfo?.plan?.id
                    )

                    return (
                        <SubscriptionPlanCard 
                            key={planInfo?.plan?.id}
                            planInfo={planInfo}
                            handleActivatePlan={handleActivatePlan}
                            activatedTrial={activatedTrial}
                            pendingRequest={pendingRequest}
                            activatedSubscriptions={activatedSubscriptions}
                            b2bAppsMap={b2bAppsMap}
                            allB2BAppIds={allB2BAppIds}
                            emoji={PLAN_CARD_EMOJIS?.[index]}
                        />
                    )
                })}
            </div>
        </Space>
    )
}

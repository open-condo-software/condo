import { useGetAvailableSubscriptionPlansQuery, GetAvailableSubscriptionPlansQueryResult, useGetOrganizationTrialSubscriptionsQuery, useActivateSubscriptionPlanMutation, useGetPendingSubscriptionRequestsQuery, useGetB2BAppsByIdsQuery } from '@app/condo/gql'
import { notification } from 'antd'
import React, { useState, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Radio } from '@open-condo/ui'

import { PromoBanner } from './PromoBanner/PromoBanner'
import { SubscriptionPlanCard } from './SubscriptionPlanCard/SubscriptionPlanCard'
import styles from './SubscriptionSettingsContent.module.css'

import { Loader } from '../../../common/components/Loader'
import { useOrganizationSubscription } from '../../hooks/useOrganizationSubscription'


type PlanPeriod = 'month' | 'year' // TODO: do as type from SubscriptionPlanPricingRule
type PlanType = GetAvailableSubscriptionPlansQueryResult['data']['result']['plans'][number]

export const SubscriptionSettingsContent: React.FC = () => {
    const intl = useIntl()
    const { organization, employee, selectEmployee } = useOrganization()
    const { refetchSubscriptionContexts } = useOrganizationSubscription()

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

    // Collect all unique B2B app IDs that appear in at least one plan's disabledB2BApps
    const allB2BAppIds = useMemo(() => {
        const plans = plansData?.result?.plans ?? []
        const appIdsSet = new Set<string>()
        
        plans.forEach(p => {
            const disabledApps = p?.plan?.disabledB2BApps || []
            disabledApps.forEach(appId => appIdsSet.add(appId))
        })
        
        return Array.from(appIdsSet)
    }, [plansData])

    // Fetch B2B apps data for those IDs
    const { data: b2bAppsData, loading: b2bAppsLoading } = useGetB2BAppsByIdsQuery({
        variables: { ids: allB2BAppIds },
        skip: allB2BAppIds.length === 0,
    })

    console.log('b2bAppsData', allB2BAppIds, b2bAppsData)

    const b2bAppsMap = useMemo(() => {
        const apps = b2bAppsData?.b2bApps || []
        console.log('apps', apps)
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
    const trialSubscriptions = trialSubscriptionsData?.trialSubscriptions || []

    const {
        data: pendingRequestsData,
        loading: pendingRequestsLoading,
        refetch: refetchPendingRequests,
    } = useGetPendingSubscriptionRequestsQuery({
        variables: {
            organizationId: organization?.id,
        },
        skip: !organization?.id,
    })
    const pendingRequests = pendingRequestsData?.pendingRequests || []

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
                await refetchPendingRequests()
                await refetchSubscriptionContexts()
                if (employee?.id) {
                    await selectEmployee(employee.id)
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
            } else {
                await refetchPendingRequests()
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
    

    if (plansLoading || trialSubscriptionsLoading || pendingRequestsLoading || b2bAppsLoading) {
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
                    const pendingRequest = pendingRequests.find(
                        request => request.subscriptionPlanPricingRule?.subscriptionPlan?.id === planInfo?.plan?.id
                    )

                    return (
                        <SubscriptionPlanCard 
                            key={planInfo?.plan?.id}
                            planInfo={planInfo}
                            handleActivatePlan={handleActivatePlan}
                            activatedTrial={activatedTrial}
                            pendingRequest={pendingRequest}
                            b2bAppsMap={b2bAppsMap}
                            allB2BAppIds={allB2BAppIds}
                        />
                    )
                })}
            </div>
        </Space>
    )
}

import { useGetAvailableSubscriptionPlansQuery, GetAvailableSubscriptionPlansQueryResult, useGetPublicB2BAppsByIdsQuery } from '@app/condo/gql'
import React, { useState, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Space, Radio } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { useActivateSubscriptions, useTrialSubscriptions } from '@condo/domains/subscription/hooks'

import { PromoBanner } from './PromoBanner/PromoBanner'
import { SubscriptionPlanCard } from './SubscriptionPlanCard/SubscriptionPlanCard'
import styles from './SubscriptionSettingsContent.module.css'


type PlanPeriod = 'month' | 'year'
type PlanType = GetAvailableSubscriptionPlansQueryResult['data']['result']['plans'][number]

const PLAN_CARD_EMOJIS = ['🏠', '🚀', '👑']

export const SubscriptionSettingsContent: React.FC = () => {
    const intl = useIntl()
    const { organization } = useOrganization()

    const YearlyLabel = intl.formatMessage({ id: 'subscription.period.yearly' })
    const MonthlyLabel = intl.formatMessage({ id: 'subscription.period.monthly' })

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

    const { data: b2bAppsData } = useGetPublicB2BAppsByIdsQuery({
        variables: { ids: allB2BAppIds },
        skip: allB2BAppIds.length === 0,
    })

    const b2bAppsMap = useMemo(() => {
        const apps = b2bAppsData?.b2bApps || []
        return new Map(apps.map(app => [app.id, app]))
    }, [b2bAppsData])

    const {
        handleActivatePlan,
        activateLoading,
        pendingRequests,
        activatedSubscriptions,
        isLoading: trialActivationLoading,
    } = useActivateSubscriptions()

    const { trialSubscriptions } =  useTrialSubscriptions()

    const isLoading = plansLoading || trialActivationLoading
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
                            trialActivateLoading={activateLoading}
                        />
                    )
                })}
            </div>
        </Space>
    )
}

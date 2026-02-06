import { useGetAvailableSubscriptionPlansQuery, useGetOrganizationActivatedSubscriptionsQuery } from '@app/condo/gql'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'

import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import styles from './UpgradePlanButton.module.css'


export const UpgradePlanButton: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const { organization } = useOrganization()
    const { subscriptionContext } = useOrganizationSubscription()

    const { data: plansData, loading: plansLoading } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id,
    })

    const { data: activatedSubscriptionsData, loading: activatedSubscriptionsLoading } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: { 
            organizationId: organization?.id || '',
        },
        skip: !organization?.id,
    })
    const activatedSubscriptions = useMemo(() => activatedSubscriptionsData?.activatedSubscriptions || [], [activatedSubscriptionsData?.activatedSubscriptions])

    const buttonText = useMemo(() => {
        if (plansLoading || activatedSubscriptionsLoading) return null
        
        const currentPlan = subscriptionContext?.subscriptionPlan
        const isTrial = subscriptionContext?.isTrial

        if (isTrial && currentPlan?.canBePromoted) {
            return intl.formatMessage({ id: 'subscription.upgradePlan.payForPlan' }, { planName: currentPlan.name })
        }

        const availablePlans = plansData?.result?.plans || []
        const currentPriority = currentPlan?.priority
        const betterPlan = availablePlans
            .filter(p => {
                if (!p.plan.canBePromoted) return false
                if (activatedSubscriptions.find(s => s.subscriptionPlan?.id === p.plan.id)) return false
                if (currentPriority === undefined || currentPriority === null) return true
                return p.plan.priority !== undefined && p.plan.priority !== null && p.plan.priority > currentPriority
            })
            .sort((a, b) => (b.plan.priority ?? 0) - (a.plan.priority ?? 0))[0]

        if (betterPlan) {
            return intl.formatMessage({ id: 'subscription.upgradePlan.tryPlan' }, { planName: betterPlan.plan.name })
        }

        if (subscriptionContext?.subscriptionPlan?.name) {
            return intl.formatMessage({ id: 'subscription.upgradePlan.currentPlan' }, { planName: subscriptionContext.subscriptionPlan?.name })
        }

        const lastExpiredSubscription = !subscriptionContext && activatedSubscriptions.length > 0 && activatedSubscriptions.reduce((latest, current) => {
            return new Date(current.endAt) > new Date(latest.endAt)
                ? current
                : latest
        })

        if (lastExpiredSubscription) {
            return intl.formatMessage({ id: 'subscription.upgradePlan.payForPlan' }, { planName: lastExpiredSubscription.subscriptionPlan?.name })
        }

        return null
    }, [subscriptionContext, plansLoading, plansData?.result?.plans, activatedSubscriptionsLoading, intl, activatedSubscriptions])

    const handleUpgradeClick = () => {
        router.push('/settings?tab=subscription')
    }

    if (!buttonText) return null
    /*TODO DOMA-12785 move to ui kit*/
    return (
        <Button
            type='accent'
            minimal
            compact
            onClick={handleUpgradeClick}
            children={[
                '🚀 ',
                // @ts-ignore
                <span key='gradient-text' className={styles.buttonText}>{buttonText}</span>,
            ]}
        />
    )
}

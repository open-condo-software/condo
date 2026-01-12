import { useGetAvailableSubscriptionPlansQuery } from '@app/condo/gql'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'

import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'


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

    const buttonText = useMemo(() => {
        if (!subscriptionContext?.subscriptionPlan || plansLoading) return null
        
        const availablePlans = plansData?.result?.plans || []
        const currentPlan = subscriptionContext.subscriptionPlan
        const isTrial = subscriptionContext.isTrial
        const currentPriority = currentPlan?.priority

        if (isTrial && currentPlan?.canBePromoted) {
            return intl.formatMessage({ id: 'subscription.upgradePlan.payForPlan' }, { planName: currentPlan.name })
        }

        const betterPlan = availablePlans
            .filter(p => {
                if (!p.plan.canBePromoted) return false
                if (currentPriority === undefined || currentPriority === null) return true
                return p.plan.priority !== undefined && p.plan.priority !== null && p.plan.priority > currentPriority
            })
            .sort((a, b) => (b.plan.priority ?? 0) - (a.plan.priority ?? 0))[0]

        if (betterPlan) {
            return intl.formatMessage({ id: 'subscription.upgradePlan.tryPlan' }, { planName: betterPlan.plan.name })
        }

        return null
    }, [subscriptionContext, plansLoading, plansData?.result?.plans, intl])

    const handleUpgradeClick = () => {
        router.push('/settings?tab=subscription')
    }

    if (!buttonText) return null

    return (
        <Button
            type='accent'
            minimal
            compact
            onClick={handleUpgradeClick}
        >
            {`🚀 ${buttonText}`}
        </Button>
    )
}

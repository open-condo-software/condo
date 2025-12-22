import { CrownOutlined } from '@ant-design/icons'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button } from '@open-condo/ui'

import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

import { useGetAvailableSubscriptionPlansQuery } from '../../../gql'

export const UpgradePlanButton: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const { organization } = useOrganization()
    const { subscription, isExpired } = useOrganizationSubscription()

    const { data: plansData, loading: plansLoading } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id,
    })

    const availablePlans = plansData?.result?.plans || []

    const buttonConfig = useMemo(() => {
        if (!subscription || isExpired || plansLoading) return null

        const currentPlan = subscription.subscriptionPlan
        const isTrial = subscription.isTrial
        const currentPriority = currentPlan?.priority

        if (isTrial && currentPlan?.canBePromoted) {
            return {
                textId: 'subscription.upgradePlan.payForPlan',
                planName: currentPlan.name,
            }
        }

        const betterPlan = availablePlans
            .filter(p => {
                if (!p.plan.canBePromoted) return false
                if (currentPriority === undefined || currentPriority === null) return true
                return p.plan.priority !== undefined && p.plan.priority !== null && p.plan.priority > currentPriority
            })
            .sort((a, b) => (b.plan.priority ?? 0) - (a.plan.priority ?? 0))[0]

        if (betterPlan) {
            return {
                textId: 'subscription.upgradePlan.tryPlan',
                planName: betterPlan.plan.name,
            }
        }

        return null
    }, [subscription, isExpired, plansLoading, availablePlans])

    const handleUpgradeClick = () => {
        router.push('/settings?tab=subscription')
    }

    if (!buttonConfig) return null

    return (
        <Button
            type='accent'
            minimal
            compact
            icon={<CrownOutlined />}
            onClick={handleUpgradeClick}
        >
            {intl.formatMessage({ id: buttonConfig.textId }, { planName: buttonConfig.planName })}
        </Button>
    )
}

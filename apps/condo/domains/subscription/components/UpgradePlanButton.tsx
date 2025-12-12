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

    // Load available plans to check if there's a better plan
    const { data: plansData, loading: plansLoading } = useGetAvailableSubscriptionPlansQuery({
        variables: {
            organization: { id: organization?.id },
        },
        skip: !organization?.id,
    })

    const availablePlans = plansData?.result?.plans || []

    // Check if current plan is basic or trial and there's a better plan available
    const shouldShowUpgradeButton = useMemo(() => {
        if (!subscription || isExpired || plansLoading) return false
        
        const currentPlanId = subscription.subscriptionPlan.id
        const currentPlan = availablePlans.find(p => p.plan.id === currentPlanId)
        
        if (!currentPlan) return false
        
        const currentPriority = currentPlan.plan.priority ?? 999
        
        // Check if there are plans with higher priority (lower number = higher priority)
        const hasBetterPlan = availablePlans.some(p => {
            const planPriority = p.plan.priority ?? 999
            return planPriority < currentPriority
        })
        
        return hasBetterPlan
    }, [subscription, isExpired, plansLoading, availablePlans])

    const handleUpgradeClick = () => {
        router.push('/settings?tab=subscription')
    }

    if (!shouldShowUpgradeButton) return null

    return (
        <Button
            type='accent'
            minimal
            compact
            icon={<CrownOutlined />}
            onClick={handleUpgradeClick}
        >
            {intl.formatMessage({ id: 'subscription.upgradePlan' })}
        </Button>
    )
}

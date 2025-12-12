import { Progress } from 'antd'
import React, { useMemo } from 'react'

import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

export const SubscriptionDaysIndicator: React.FC = () => {
    const { subscription, isExpired } = useOrganizationSubscription()

    const isTrial = subscription?.isTrial
    const daysRemaining = subscription?.daysRemaining
    const trialDays = subscription?.subscriptionPlan?.trialDays

    // Show indicator logic:
    // 1. During trial period (from first to last day)
    // 2. When 7 or fewer days remain until payment
    const shouldShow = useMemo(() => {
        if (!subscription || isExpired) return false
        
        // Show during trial period
        if (isTrial && daysRemaining !== undefined && daysRemaining >= 0) {
            return true
        }
        
        // Show when 7 or fewer days remain until payment (for paid subscriptions)
        if (!isTrial && daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining > 0) {
            return true
        }
        
        return false
    }, [subscription, isExpired, isTrial, daysRemaining])

    // Calculate progress percentage
    const progressPercent = useMemo(() => {
        if (!daysRemaining || !trialDays) return 0
        
        if (isTrial) {
            // For trial: show how much time is left
            return Math.round((daysRemaining / trialDays) * 100)
        } else {
            // For paid: show countdown from 7 to 0
            return Math.round((daysRemaining / 7) * 100)
        }
    }, [daysRemaining, trialDays, isTrial])

    // Determine color based on days remaining
    const strokeColor = useMemo(() => {
        if (!daysRemaining) return '#52c41a'
        
        if (daysRemaining === 1) return '#ff4d4f' // red
        if (daysRemaining <= 7) return '#faad14' // orange
        return '#52c41a' // green
    }, [daysRemaining])

    if (!shouldShow) return null

    return (
        <Progress
            type='circle'
            percent={progressPercent}
            strokeColor={strokeColor}
            format={() => (
                <span style={{ 
                    fontSize: '12px',
                    fontWeight: 600,
                    color: strokeColor,
                }}>
                    {daysRemaining}
                </span>
            )}
            width={34}
            strokeWidth={6}
        />
    )
}

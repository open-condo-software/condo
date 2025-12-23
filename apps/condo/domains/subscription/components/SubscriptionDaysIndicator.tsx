import { Progress, Tooltip } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

export const SubscriptionDaysIndicator: React.FC = () => {
    const intl = useIntl()
    const { subscriptionContext, isExpired } = useOrganizationSubscription()

    const isTrial = subscriptionContext?.isTrial
    const daysRemaining = subscriptionContext?.daysRemaining
    const planName = subscriptionContext?.subscriptionPlan?.name || ''
    const endDate = subscriptionContext?.endAt ? dayjs(subscriptionContext.endAt).format('DD.MM.YY') : ''

    // Show indicator logic:
    // 1. Trial: show when 30 days or less remain
    // 2. Paid: show when 7 days or less remain
    const shouldShow = useMemo(() => {
        if (!subscriptionContext || isExpired || daysRemaining === undefined || daysRemaining === null) return false
        
        // Show when 30 or fewer days remain for trial
        if (isTrial && daysRemaining <= 30 && daysRemaining >= 0) {
            return true
        }
        
        // Show when 7 or fewer days remain for paid subscriptions
        if (!isTrial && daysRemaining <= 7 && daysRemaining >= 0) {
            return true
        }
        
        return false
    }, [subscriptionContext, isExpired, isTrial, daysRemaining])

    // Calculate progress percentage
    const progressPercent = useMemo(() => {
        if (daysRemaining === undefined || daysRemaining === null) return 0
        
        if (isTrial) {
            // For trial: show countdown from 30 to 0
            return Math.round((daysRemaining / 30) * 100)
        } else {
            // For paid: show countdown from 7 to 0
            return Math.round((daysRemaining / 7) * 100)
        }
    }, [daysRemaining, isTrial])

    // Determine color based on days remaining
    const strokeColor = useMemo(() => {
        if (!daysRemaining) return '#52c41a'
        
        if (daysRemaining === 1) return '#ff4d4f' // red
        if (daysRemaining <= 7) return '#faad14' // orange
        return '#52c41a' // green
    }, [daysRemaining])

    const tooltipText = useMemo(() => {
        if (isTrial) {
            return intl.formatMessage(
                { id: 'subscription.daysIndicator.tooltip.trial' },
                { planName, endDate, days: daysRemaining }
            )
        }
        return intl.formatMessage(
            { id: 'subscription.daysIndicator.tooltip.paid' },
            { planName, endDate, days: daysRemaining }
        )
    }, [isTrial, intl, planName, endDate, daysRemaining])

    if (!shouldShow) return null

    return (
        <Tooltip title={tooltipText}>
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
        </Tooltip>
    )
}

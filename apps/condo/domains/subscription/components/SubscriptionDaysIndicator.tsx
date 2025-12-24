import { Progress, Tooltip } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

export const SubscriptionDaysIndicator: React.FC = () => {
    const intl = useIntl()
    const { subscriptionContext } = useOrganizationSubscription()

    const isTrial = subscriptionContext?.isTrial
    const daysRemaining = subscriptionContext?.daysRemaining
    const planName = subscriptionContext?.subscriptionPlan?.name || ''
    const endDate = subscriptionContext?.endAt ? dayjs(subscriptionContext.endAt).format('DD.MM.YY') : ''

    const shouldShow = useMemo(() => {
        if (!subscriptionContext || daysRemaining === undefined || daysRemaining === null) return false
        if (isTrial && daysRemaining <= 30 && daysRemaining >= 0) {
            return true
        }
        if (!isTrial && daysRemaining <= 7 && daysRemaining >= 0) {
            return true
        }
        return false
    }, [subscriptionContext, isTrial, daysRemaining])

    const progressPercent = useMemo(() => {
        if (daysRemaining === undefined || daysRemaining === null) return 0
        
        if (isTrial) {
            return Math.round((daysRemaining / 30) * 100)
        } else {
            return Math.round((daysRemaining / 7) * 100)
        }
    }, [daysRemaining, isTrial])

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

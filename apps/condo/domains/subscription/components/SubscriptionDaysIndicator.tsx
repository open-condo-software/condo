import { Progress, Tooltip } from 'antd'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'

const BRAND_GRADIENT = {
    '0%': colors.green[5],
    '100%': colors.blue[5],
}

export const SubscriptionDaysIndicator: React.FC = () => {
    const intl = useIntl()
    const { subscriptionContext, daysRemaining, daysRemainingWithoutBuffer, isInBufferPeriod } = useOrganizationSubscription()

    const isTrial = subscriptionContext?.isTrial
    const planName = subscriptionContext?.subscriptionPlan?.name || ''
    const endDate = subscriptionContext?.endAt ? dayjs(subscriptionContext.endAt).format('DD.MM.YY') : ''

    const hasPaymentMethod = Boolean(subscriptionContext?.bindingId)
    
    const shouldShow = useMemo(() => {
        if (!subscriptionContext || daysRemaining === undefined || daysRemaining === null) return false
        
        if (hasPaymentMethod && !isInBufferPeriod) return false
        
        if (isTrial && daysRemainingWithoutBuffer <= 30 && daysRemainingWithoutBuffer >= 0) {
            return true
        }
        
        if (!isTrial && daysRemainingWithoutBuffer <= 7 && daysRemainingWithoutBuffer >= 0) {
            return true
        }
        
        if (!isTrial && isInBufferPeriod && daysRemaining > 0) {
            return true
        }
        
        return false
    }, [subscriptionContext, isTrial, daysRemaining, daysRemainingWithoutBuffer, isInBufferPeriod, hasPaymentMethod])

    const progressPercent = useMemo(() => {
        if (daysRemaining === undefined || daysRemaining === null) return 0
        
        if (isInBufferPeriod) {
            return Math.round((daysRemaining / 30) * 100)
        }
        
        if (isTrial) {
            const startAt = subscriptionContext?.startAt
            const endAt = subscriptionContext?.endAt
            
            if (startAt && endAt) {
                const totalDays = dayjs(endAt).diff(dayjs(startAt), 'day')
                if (totalDays > 0) {
                    return Math.round((daysRemainingWithoutBuffer / totalDays) * 100)
                }
            }
            
            return Math.round((daysRemainingWithoutBuffer / 7) * 100)
        } else {
            return Math.round((daysRemainingWithoutBuffer / 30) * 100)
        }
    }, [daysRemaining, daysRemainingWithoutBuffer, isTrial, isInBufferPeriod, subscriptionContext?.startAt, subscriptionContext?.endAt])

    const strokeColor = useMemo(() => {
        if (isInBufferPeriod) {
            return colors.red[5]
        }
        
        const activeDays = isTrial ? daysRemainingWithoutBuffer : daysRemainingWithoutBuffer
        
        if (!activeDays) {
            return BRAND_GRADIENT
        }
        
        if (activeDays <= 1) {
            return colors.red[5]
        }
        if (activeDays <= 7) {
            return colors.orange[5]
        }
        return BRAND_GRADIENT
    }, [daysRemainingWithoutBuffer, isTrial, isInBufferPeriod])

    const tooltipText = useMemo(() => {
        if (isInBufferPeriod) {
            return intl.formatMessage(
                { id: 'subscription.daysIndicator.tooltip.expired' },
                { planName, days: daysRemaining }
            )
        }
        
        if (isTrial) {
            return intl.formatMessage(
                { id: 'subscription.daysIndicator.tooltip.trial' },
                { planName, endDate, days: daysRemainingWithoutBuffer }
            )
        }
        return intl.formatMessage(
            { id: 'subscription.daysIndicator.tooltip.paid' },
            { planName, endDate, days: daysRemainingWithoutBuffer }
        )
    }, [isTrial, isInBufferPeriod, intl, planName, endDate, daysRemaining, daysRemainingWithoutBuffer])

    if (!shouldShow) return null

    return (
        <Tooltip title={tooltipText}>
            <Progress
                type='circle'
                percent={progressPercent}
                strokeColor={strokeColor}
                format={() => (
                    <Typography.Text 
                        type={isInBufferPeriod ? 'danger' : 'secondary'}
                        size='small'
                    >
                        {isInBufferPeriod ? daysRemaining : daysRemainingWithoutBuffer}
                    </Typography.Text>
                )}
                width={34}
                strokeWidth={14}
            />
        </Tooltip>
    )
}

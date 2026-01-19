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

    const  strokeColor  = useMemo(() => {
        if (!daysRemaining) {
            return BRAND_GRADIENT
        }
        
        if (daysRemaining <= 1) {
            return colors.red[5]

        }
        if (daysRemaining <= 7) {
            return colors.orange[5]

        }
        return BRAND_GRADIENT
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
                    <Typography.Text type='secondary' size='small'>
                        {daysRemaining}
                    </Typography.Text>
                )}
                width={34}
                strokeWidth={14}
            />
        </Tooltip>
    )
}

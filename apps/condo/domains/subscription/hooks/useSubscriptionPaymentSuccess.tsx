import { useGetLastDoneSubscriptionContextQuery } from '@app/condo/gql'
import { notification } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'


type UseSubscriptionPaymentSuccessParams = {
    planId: string | null | undefined
    organizationId: string | null | undefined
    onAfterNotification?: () => void
}

/**
 * Detects successful subscription payment return (via `successPayment=true` query param)
 * and shows a notification. Optionally calls `onAfterNotification` for extra actions (e.g. a modal).
 *
 * Uses `localStorage` keyed as `subscription_end_date_{planId}` to avoid re-triggering.
 * The notification fires only if the last DONE context was created today.
 */
export const useSubscriptionPaymentSuccess = ({
    planId,
    organizationId,
    onAfterNotification,
}: UseSubscriptionPaymentSuccessParams): void => {
    const intl = useIntl()
    const router = useRouter()
    const SuccessNotificationTitle = intl.formatMessage({ id: 'subscription.payment.success.notification.title' })
    const SuccessNotificationDescription = intl.formatMessage({ id: 'subscription.payment.success.notification.description' })

    const { data, loading } = useGetLastDoneSubscriptionContextQuery({
        variables: { organizationId: organizationId as string, planId: planId as string },
        skip: !planId || !organizationId,
    })

    const currentCreatedAt: string | null = data?.contexts?.[0]?.createdAt ?? null
    const storageKey = planId ? `subscription_end_date_${planId}` : null

    const handleSuccess = useCallback(() => {
        notification.success({
            message: (
                <Typography.Text strong size='large'>
                    {SuccessNotificationTitle}
                </Typography.Text>
            ),
            description: (
                <Typography.Text type='secondary' size='medium'>
                    {SuccessNotificationDescription}
                </Typography.Text>
            ),
            duration: 5,
        })
        onAfterNotification?.()
    }, [SuccessNotificationTitle, SuccessNotificationDescription, onAfterNotification])

    // Keep localStorage in sync when not in a successPayment flow
    useEffect(() => {
        if (!loading && currentCreatedAt && storageKey && !router.query.successPayment) {
            localStorage.setItem(storageKey, currentCreatedAt)
        }
    }, [loading, currentCreatedAt, storageKey, router])

    // Detect payment success: fire only when context was created today and createdAt changed
    useEffect(() => {
        if (router.query.successPayment !== 'true' || loading || !storageKey) return

        const previousValue = localStorage.getItem(storageKey)
        const isCreatedToday = currentCreatedAt ? dayjs(currentCreatedAt).isSame(dayjs(), 'day') : false

        if (previousValue !== currentCreatedAt && currentCreatedAt && isCreatedToday) {
            localStorage.setItem(storageKey, currentCreatedAt)
            handleSuccess()
        }

        const { successPayment, ...restQuery } = router.query
        router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true })
    }, [router, loading, currentCreatedAt, storageKey, handleSuccess])
}

import { useGetLastDoneSubscriptionContextQuery } from '@app/condo/gql'
import { notification } from 'antd'
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
 * Uses `localStorage` keyed as `subscription_end_date_{planId}` to avoid re-triggering
 * when the user visits the page again without a new payment.
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

    const currentEndAt: string | null = data?.contexts?.[0]?.endAt ?? null
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

    useEffect(() => {
        if (!loading && currentEndAt && storageKey && !router.query.successPayment) {
            localStorage.setItem(storageKey, currentEndAt)
        }
    }, [loading, currentEndAt, storageKey, router])

    useEffect(() => {
        if (router.query.successPayment !== 'true' || loading || !storageKey) return

        const previousValue = localStorage.getItem(storageKey)

        if (previousValue !== currentEndAt && currentEndAt) {
            localStorage.setItem(storageKey, currentEndAt)
            handleSuccess()
        }

        const { successPayment, ...restQuery } = router.query
        router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true })
    }, [router, loading, currentEndAt, storageKey, handleSuccess])
}

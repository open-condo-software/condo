import { useGetLastDoneSubscriptionContextQuery } from '@app/condo/gql'
import { notification } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useRef } from 'react'

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
 * Uses `localStorage` keyed as `subscription_last_context_at_{planId}` to avoid re-triggering.
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

    const storageKey = planId ? `subscription_last_context_at_${planId}` : null

    // Captured once at mount — survives URL cleanup done by router.replace below
    const inSuccessFlow = useRef(router.query.successPayment === 'true')

    const { data, loading } = useGetLastDoneSubscriptionContextQuery({
        variables: { organizationId: organizationId as string, planId: planId as string },
        skip: !planId || !organizationId,
        // Bypass Apollo cache so we always get the freshly-created context after redirect
        fetchPolicy: inSuccessFlow.current ? 'network-only' : 'cache-first',
    })

    const currentCreatedAt: string | null = data?.contexts?.[0]?.createdAt ?? null

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

    // Keep localStorage in sync outside of success flow
    useEffect(() => {
        if (!loading && currentCreatedAt && storageKey && !inSuccessFlow.current) {
            localStorage.setItem(storageKey, currentCreatedAt)
        }
    }, [loading, currentCreatedAt, storageKey])

    // Detect payment success: fire only when context was created today and createdAt changed
    useEffect(() => {
        if (!inSuccessFlow.current || loading || !storageKey || !currentCreatedAt) return

        // Clean up URL now that we have fresh data to evaluate
        if (router.query.successPayment === 'true') {
            const restQuery = Object.fromEntries(Object.entries(router.query).filter(([key]) => key !== 'successPayment'))
            router.replace({ pathname: router.pathname, query: restQuery }, undefined, { shallow: true })
        }

        const previousValue = localStorage.getItem(storageKey)
        const isCreatedToday = dayjs(currentCreatedAt).isSame(dayjs(), 'day')

        if (previousValue !== currentCreatedAt && isCreatedToday) {
            localStorage.setItem(storageKey, currentCreatedAt)
            inSuccessFlow.current = false
            handleSuccess()
        }
    }, [router, loading, currentCreatedAt, storageKey, handleSuccess])
}

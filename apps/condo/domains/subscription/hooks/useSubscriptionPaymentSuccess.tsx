import { useGetLastDoneOrganizationSubscriptionContextsQuery, useGetLastDoneSubscriptionContextQuery } from '@app/condo/gql'
import { notification } from 'antd'
import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { SUBSCRIPTION_PLAN_TYPE_SERVICE } from '@condo/domains/subscription/constants'


type UseSubscriptionPaymentSuccessParams = {
    /** The plan that was paid for. Without it the latest bundle the organization paid for is taken */
    planId?: string | null
    organizationId: string | null | undefined
    onAfterNotification?: () => void
}

/**
 * Detects successful subscription payment return (via `successPayment=true` query param)
 * and shows a notification. Optionally calls `onAfterNotification` for extra actions (e.g. a modal).
 *
 * Uses `localStorage` keyed as `subscription_last_context_at_{planId or organizationId}` to avoid re-triggering.
 * The notification fires only if the last DONE context was created today.
 */
export const useSubscriptionPaymentSuccess = ({
    planId,
    organizationId,
    onAfterNotification,
}: UseSubscriptionPaymentSuccessParams): void => {
    const intl = useIntl()
    const router = useRouter()
    const PlanTitle = intl.formatMessage({ id: 'subscription.payment.success.notification.title' })
    const PlanDescription = intl.formatMessage({ id: 'subscription.payment.success.notification.description' })
    const FeaturesTitle = intl.formatMessage({ id: 'subscription.activation.features.title' })
    const FeaturesDescription = intl.formatMessage({ id: 'subscription.activation.features.description' })

    const storageScopeId = planId || organizationId
    const storageKey = storageScopeId ? `subscription_last_context_at_${storageScopeId}` : null

    // Captured once at mount — survives URL cleanup done by router.replace below
    const inSuccessFlow = useRef(router.query.successPayment === 'true')
    // Bypass Apollo cache so we always get the freshly-created context after redirect
    const fetchPolicy = inSuccessFlow.current ? 'network-only' : 'cache-first'

    const { data: planData, loading: planLoading } = useGetLastDoneSubscriptionContextQuery({
        variables: { organizationId: organizationId as string, planId: planId as string },
        skip: !planId || !organizationId,
        fetchPolicy,
    })
    const { data: organizationData, loading: organizationLoading } = useGetLastDoneOrganizationSubscriptionContextsQuery({
        variables: { organizationId: organizationId as string },
        skip: Boolean(planId) || !organizationId,
        fetchPolicy,
    })

    const loading = planLoading || organizationLoading
    const contexts = useMemo(
        () => (planId ? planData?.contexts : organizationData?.contexts) ?? [],
        [planId, planData, organizationData]
    )
    const currentCreatedAt: string | null = contexts[0]?.createdAt ?? null

    /** A bundle with a service plan is announced as a plan purchase, features bought on their own get their own words */
    const isPlanPurchase = useMemo(() => {
        const latest = contexts[0]
        if (!latest) return false
        const bundle = latest.invoice?.id
            ? contexts.filter(context => context.invoice?.id === latest.invoice.id)
            : [latest]

        return bundle.some(context => context.subscriptionPlan?.planType === SUBSCRIPTION_PLAN_TYPE_SERVICE)
    }, [contexts])

    const handleSuccess = useCallback(() => {
        notification.success({
            message: (
                <Typography.Text strong size='large'>
                    {isPlanPurchase ? PlanTitle : FeaturesTitle}
                </Typography.Text>
            ),
            description: (
                <Typography.Text type='secondary' size='medium'>
                    {isPlanPurchase ? PlanDescription : FeaturesDescription}
                </Typography.Text>
            ),
            duration: 5,
        })
        onAfterNotification?.()
    }, [isPlanPurchase, PlanTitle, PlanDescription, FeaturesTitle, FeaturesDescription, onAfterNotification])

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

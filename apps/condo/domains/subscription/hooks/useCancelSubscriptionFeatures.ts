import {
    useCancelSubscriptionRenewalMutation,
    useGetOrganizationActivatedSubscriptionsQuery,
    useGetOrganizationUnpaidSubscriptionsQuery,
} from '@app/condo/gql'
import { notification } from 'antd'
import { useCallback, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { SUBSCRIPTION_PAYMENT_BUFFER_DAYS } from '@condo/domains/subscription/constants'
import { getContextIdsToCancel } from '@condo/domains/subscription/utils/subscriptionCatalog'


type UseCancelSubscriptionFeaturesParams = {
    onCancelled?: () => void | Promise<void>
}

/**
 * Removes feature plans from the subscription. The features stay usable until the period already
 * paid for runs out, and everything else bought in the same bundle — the plan above all — keeps
 * renewing on the same card.
 */
export const useCancelSubscriptionFeatures = ({ onCancelled }: UseCancelSubscriptionFeaturesParams = {}) => {
    const intl = useIntl()
    const DoneMessage = intl.formatMessage({ id: 'subscription.remove.notification.title' })
    const ErrorMessage = intl.formatMessage({ id: 'subscription.remove.error.title' })

    const { organization } = useOrganization()
    const organizationId = organization?.id || ''

    const [loading, setLoading] = useState(false)
    const [cancelSubscriptionRenewal] = useCancelSubscriptionRenewalMutation()

    const { data: activatedData, refetch: refetchActivated } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: { organizationId },
        skip: !organizationId,
    })
    const { data: unpaidData, refetch: refetchUnpaid } = useGetOrganizationUnpaidSubscriptionsQuery({
        variables: { organizationId },
        skip: !organizationId,
    })

    const cancelFeaturePlans = useCallback(async (planIds: ReadonlyArray<string>) => {
        const contextIds = getContextIdsToCancel({
            planIds,
            paidContexts: activatedData?.activatedSubscriptions ?? [],
            unpaidContexts: unpaidData?.unpaidSubscriptions ?? [],
            now: new Date(),
            bufferDays: SUBSCRIPTION_PAYMENT_BUFFER_DAYS,
        })
        if (contextIds.length === 0) return

        setLoading(true)
        try {
            await cancelSubscriptionRenewal({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        subscriptionContexts: contextIds.map(id => ({ id })),
                    },
                },
            })

            notification.success({ message: DoneMessage, duration: 5 })
            await Promise.all([refetchActivated(), refetchUnpaid()])
            await onCancelled?.()
        } catch (error) {
            console.error('Failed to cancel subscription features:', error)
            notification.error({
                message: ErrorMessage,
                description: error?.message,
                duration: 5,
            })
        } finally {
            setLoading(false)
        }
    }, [activatedData, unpaidData, cancelSubscriptionRenewal, refetchActivated, refetchUnpaid, onCancelled, DoneMessage, ErrorMessage])

    return { cancelFeaturePlans, loading }
}

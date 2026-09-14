import { useCancelSubscriptionRenewalMutation } from '@app/condo/gql'
import { notification } from 'antd'
import { useCallback, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'


type UseCancelSubscriptionFeaturesParams = {
    onCancelled?: () => void | Promise<void>
}

/**
 * Stops auto-renewal for the given subscription contexts only. The features stay usable until
 * the period already paid for runs out, and everything else bought in the same bundle — the plan
 * above all — keeps renewing on the same card.
 */
export const useCancelSubscriptionFeatures = ({ onCancelled }: UseCancelSubscriptionFeaturesParams = {}) => {
    const intl = useIntl()
    const DoneMessage = intl.formatMessage({ id: 'subscription.remove.notification.title' })
    const ErrorMessage = intl.formatMessage({ id: 'subscription.remove.error.title' })

    const [loading, setLoading] = useState(false)
    const [cancelSubscriptionRenewal] = useCancelSubscriptionRenewalMutation()

    const cancelFeatures = useCallback(async (contextIds: ReadonlyArray<string>) => {
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
    }, [cancelSubscriptionRenewal, onCancelled, DoneMessage, ErrorMessage])

    return { cancelFeatures, loading }
}

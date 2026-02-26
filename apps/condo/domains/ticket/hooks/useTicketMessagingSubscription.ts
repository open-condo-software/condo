import { useCallback } from 'react'

import { useMessagingConnection, useMessagingSubscription, MessagingMessage } from '@open-condo/messaging/hooks'
import { useOrganization } from '@open-condo/next/organization'

export interface TicketChangeData {
    id: string
    operation: 'create' | 'update' | 'delete'
}

interface UseTicketMessagingSubscriptionOptions {
    enabled?: boolean
    onMessage?: (data: TicketChangeData, msg: MessagingMessage) => void | Promise<void>
}

export const useTicketMessagingSubscription = (options: UseTicketMessagingSubscriptionOptions = {}) => {
    const { enabled = true, onMessage } = options
    const { organization } = useOrganization()

    const { connection, isConnected, isConnecting, error: connectionError } = useMessagingConnection({
        enabled: enabled && !!organization?.id,
    })

    const topic = organization?.id ? `organization.${organization.id}.ticket` : ''

    const handleMessage = useCallback(async (data: TicketChangeData, msg: MessagingMessage) => {
        console.log('[messaging] Received ticket change:', data)
        if (onMessage) {
            await onMessage(data, msg)
        }
    }, [onMessage])

    const {
        isSubscribed,
        isSubscribing,
        error: subscriptionError,
        messageCount,
    } = useMessagingSubscription<TicketChangeData>({
        topic,
        connection,
        isConnected,
        enabled: enabled && !!topic && isConnected,
        onMessage: handleMessage,
    })

    return {
        isConnected,
        isConnecting,
        isSubscribed,
        isSubscribing,
        messageCount,
        error: connectionError || subscriptionError,
    }
}

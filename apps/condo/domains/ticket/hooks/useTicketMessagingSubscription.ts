import { Msg } from '@nats-io/nats-core'
import { useCallback } from 'react'

// @ts-ignore - JS module without type declarations
import { useMessagingConnection, useMessagingSubscription } from '@open-condo/messaging/hooks'
// @ts-ignore - JS module without type declarations
import { buildTopic } from '@open-condo/messaging/topic'
import { useOrganization } from '@open-condo/next/organization'

export interface TicketChangeData {
    ticketId: string
    organizationId: string
    operation: 'create' | 'update'
    status: string
    number: number
    timestamp: string
    userId: string | null
}

interface UseTicketMessagingSubscriptionOptions {
    enabled?: boolean
    onMessage?: (data: TicketChangeData, msg: Msg) => void | Promise<void>
}

export const useTicketMessagingSubscription = (options: UseTicketMessagingSubscriptionOptions = {}) => {
    const { enabled = true, onMessage } = options
    const { organization } = useOrganization()

    const { connection, isConnected, isConnecting, error: connectionError, allowedChannels } = useMessagingConnection({
        enabled: enabled && !!organization?.id,
    })

    const topic = organization?.id ? buildTopic('ticket-changes', organization.id, '>') : ''

    const handleMessage = useCallback(async (data: TicketChangeData, msg: Msg) => {
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
        channelName: 'ticket-changes',
        topic,
        connection,
        isConnected,
        allowedChannels,
        organizationId: organization?.id,
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

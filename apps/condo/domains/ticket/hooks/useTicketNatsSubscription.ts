import { Msg } from 'nats.ws'
import { useCallback } from 'react'

import { useNatsConnection, useNatsSubscription } from '@open-condo/nats/hooks'
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

interface UseTicketNatsSubscriptionOptions {
    enabled?: boolean
    onMessage?: (data: TicketChangeData, msg: Msg) => void | Promise<void>
}

export const useTicketNatsSubscription = (options: UseTicketNatsSubscriptionOptions = {}) => {
    const { enabled = true, onMessage } = options
    const { organization } = useOrganization()

    const { connection, isConnected, isConnecting, error: connectionError, allowedStreams } = useNatsConnection({
        enabled: enabled && !!organization?.id,
    })

    const subject = organization?.id ? `ticket-changes.${organization.id}.>` : ''

    const handleMessage = useCallback(async (data: TicketChangeData, msg: Msg) => {
        console.log('[NATS] Received ticket change:', data)
        if (onMessage) {
            await onMessage(data, msg)
        }
    }, [onMessage])

    const {
        isSubscribed,
        isSubscribing,
        error: subscriptionError,
        messageCount,
    } = useNatsSubscription<TicketChangeData>({
        streamName: 'ticket-changes',
        subject,
        connection,
        isConnected,
        allowedStreams,
        organizationId: organization?.id,
        enabled: enabled && !!subject && isConnected,
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

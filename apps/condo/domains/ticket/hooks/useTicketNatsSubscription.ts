import { JsMsg } from 'nats.ws'
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
    onMessage?: (data: TicketChangeData, msg: JsMsg) => void | Promise<void>
    autoAck?: boolean
}

export const useTicketNatsSubscription = (options: UseTicketNatsSubscriptionOptions = {}) => {
    const { enabled = true, onMessage, autoAck = true } = options
    const { organization } = useOrganization()

    const { connection, isConnected, isConnecting, error: connectionError } = useNatsConnection({
        enabled: enabled && !!organization?.id,
    })

    const subject = organization?.id ? `ticket-changes.${organization.id}.>` : ''

    const handleMessage = useCallback(async (data: TicketChangeData, msg: JsMsg) => {
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
        enabled: enabled && !!subject && isConnected,
        onMessage: handleMessage,
        autoAck,
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

import { JSONCodec, Msg, Subscription, NatsConnection, createInbox } from 'nats.ws'
import { useEffect, useRef, useCallback, useState } from 'react'

interface UseNatsSubscriptionOptions<T> {
    streamName: string
    subject: string
    connection: NatsConnection | null
    isConnected: boolean
    allowedStreams?: string[]
    organizationId?: string
    enabled?: boolean
    onMessage?: (data: T, msg: Msg) => void | Promise<void>
}

interface NatsSubscriptionState {
    isSubscribed: boolean
    isSubscribing: boolean
    error: Error | null
    messageCount: number
}

/**
 * Uses a PUB-gated subscription relay for secure cross-organization isolation.
 *
 * NATS does not enforce SUB permissions in auth_callout non-operator mode,
 * but PUB permissions ARE enforced. This hook uses PUB to request a
 * server-side relay that forwards messages to the client's unique INBOX.
 *
 * Flow:
 * 1. Client subscribes to a unique delivery INBOX
 * 2. Client publishes to `_NATS.subscribe.{stream}.{orgId}` (PUB-gated by NATS)
 * 3. Server-side relay subscribes to stream subjects and forwards to client INBOX
 * 4. On cleanup, client publishes `_NATS.unsubscribe.{relayId}`
 */
export const useNatsSubscription = <T = unknown>(options: UseNatsSubscriptionOptions<T>) => {
    const {
        streamName,
        subject,
        connection,
        isConnected,
        allowedStreams,
        organizationId,
        enabled = true,
        onMessage,
    } = options
    const [state, setState] = useState<NatsSubscriptionState>({
        isSubscribed: false,
        isSubscribing: false,
        error: null,
        messageCount: 0,
    })

    const subscriptionRef = useRef<Subscription | null>(null)
    const relayIdRef = useRef<string | null>(null)
    const isActiveRef = useRef(true)
    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const unsubscribe = useCallback(() => {
        if (relayIdRef.current && connection && !connection.isClosed()) {
            try {
                connection.publish(`_NATS.unsubscribe.${relayIdRef.current}`)
            } catch (error) {
                console.error('[NATS] Error sending unsubscribe:', error)
            }
            relayIdRef.current = null
        }
        if (subscriptionRef.current) {
            try {
                subscriptionRef.current.unsubscribe()
                subscriptionRef.current = null
                setState(prev => ({ ...prev, isSubscribed: false }))
                console.log('[NATS] Unsubscribed from relay')
            } catch (error) {
                console.error('[NATS] Error unsubscribing:', error)
            }
        }
    }, [connection])

    useEffect(() => {
        if (!enabled || !isConnected || !connection || !organizationId) {
            return
        }
        isActiveRef.current = true
        let inboxSub: Subscription | null = null
        let currentRelayId: string | null = null

        const subscribe = async () => {
            try {
                setState(prev => ({ ...prev, isSubscribing: true, error: null }))

                if (allowedStreams && !allowedStreams.includes(streamName)) {
                    throw new Error(`[NATS] Stream "${streamName}" is not in allowedStreams. Access denied.`)
                }

                const jsonCodec = JSONCodec<T>()
                const requestCodec = JSONCodec()
                const deliverInbox = createInbox()

                console.log(`[NATS] Setting up relay for ${streamName}.${organizationId}`)

                inboxSub = connection.subscribe(deliverInbox)
                subscriptionRef.current = inboxSub

                const relaySubject = `_NATS.subscribe.${streamName}.${organizationId}`
                const response = await connection.request(
                    relaySubject,
                    requestCodec.encode({ deliverInbox }),
                    { timeout: 5000 }
                )

                const relayResponse = requestCodec.decode(response.data) as { relayId: string, status: string }
                currentRelayId = relayResponse.relayId
                relayIdRef.current = currentRelayId

                if (!isActiveRef.current) {
                    connection.publish(`_NATS.unsubscribe.${currentRelayId}`)
                    inboxSub.unsubscribe()
                    return
                }

                setState(prev => ({
                    ...prev,
                    isSubscribed: true,
                    isSubscribing: false,
                }))

                console.log(`[NATS] Relay active: ${currentRelayId} → ${deliverInbox}`)

                ;(async () => {
                    for await (const msg of inboxSub) {
                        if (!isActiveRef.current) break

                        try {
                            const data = jsonCodec.decode(msg.data)

                            setState(prev => ({ ...prev, messageCount: prev.messageCount + 1 }))

                            if (onMessageRef.current) {
                                await onMessageRef.current(data, msg)
                            }
                        } catch (error) {
                            console.error('[NATS] Error processing message:', error)
                        }
                    }
                })()
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error))
                console.error('[NATS] Subscription relay error:', err)
                setState(prev => ({
                    ...prev,
                    isSubscribing: false,
                    error: err,
                }))
            }
        }

        subscribe()

        return () => {
            isActiveRef.current = false
            if (currentRelayId && connection && !connection.isClosed()) {
                try {
                    connection.publish(`_NATS.unsubscribe.${currentRelayId}`)
                } catch {
                    // connection may be closed
                }
            }
            if (inboxSub) {
                inboxSub.unsubscribe()
            }
        }
    }, [enabled, isConnected, connection, streamName, organizationId, allowedStreams])

    return {
        isSubscribed: state.isSubscribed,
        isSubscribing: state.isSubscribing,
        error: state.error,
        messageCount: state.messageCount,
        unsubscribe,
    }
}

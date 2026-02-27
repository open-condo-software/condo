import { Msg, Subscription, NatsConnection, createInbox } from '@nats-io/nats-core'
import { useEffect, useRef, useCallback, useState } from 'react'

const RELAY_SUBSCRIBE_PREFIX = '_MESSAGING.subscribe'
const RELAY_UNSUBSCRIBE_PREFIX = '_MESSAGING.unsubscribe'

interface UseMessagingSubscriptionOptions<T> {
    topic: string
    connection: NatsConnection | null
    isConnected: boolean
    enabled?: boolean
    onMessage?: (data: T, msg: Msg) => void | Promise<void>
}

interface MessagingSubscriptionState {
    isSubscribed: boolean
    isSubscribing: boolean
    error: Error | null
    messageCount: number
}

/**
 * Uses a PUB-gated subscription relay for secure cross-organization isolation.
 *
 * The broker does not enforce SUB permissions in auth_callout non-operator mode,
 * but PUB permissions ARE enforced. This hook uses PUB to request a
 * server-side relay that forwards messages to the client's unique INBOX.
 *
 * Flow:
 * 1. Client subscribes to a unique delivery INBOX
 * 2. Client publishes to `_MESSAGING.subscribe.<topic>` (PUB-gated)
 * 3. Server-side relay subscribes to actual topic and forwards to client INBOX
 * 4. On cleanup, client publishes `_MESSAGING.unsubscribe.{relayId}`
 */
export const useMessagingSubscription = <T = unknown>(options: UseMessagingSubscriptionOptions<T>) => {
    const {
        topic,
        connection,
        isConnected,
        enabled = true,
        onMessage,
    } = options
    const [state, setState] = useState<MessagingSubscriptionState>({
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
                connection.publish(`${RELAY_UNSUBSCRIBE_PREFIX}.${relayIdRef.current}`)
            } catch (error) {
                console.error('[messaging] Error sending unsubscribe:', error)
            }
            relayIdRef.current = null
        }
        if (subscriptionRef.current) {
            try {
                subscriptionRef.current.unsubscribe()
                subscriptionRef.current = null
                setState(prev => ({ ...prev, isSubscribed: false }))
                console.log('[messaging] Unsubscribed from relay')
            } catch (error) {
                console.error('[messaging] Error unsubscribing:', error)
            }
        }
    }, [connection])

    useEffect(() => {
        if (!enabled || !isConnected || !connection || !topic) {
            return
        }
        isActiveRef.current = true
        let inboxSub: Subscription | null = null
        let currentRelayId: string | null = null

        const subscribe = async () => {
            try {
                if (connection.isClosed() || connection.isDraining()) {
                    return
                }

                setState(prev => ({ ...prev, isSubscribing: true, error: null }))

                const deliverInbox = createInbox()

                console.log(`[messaging] Setting up relay for ${topic}`)

                inboxSub = connection.subscribe(deliverInbox)
                subscriptionRef.current = inboxSub

                const relayTopic = `${RELAY_SUBSCRIBE_PREFIX}.${topic}`
                const response = await connection.request(
                    relayTopic,
                    JSON.stringify({ deliverInbox }),
                    { timeout: 5000 }
                )

                const relayResponse = response.json() as { relayId: string, status: string }
                currentRelayId = relayResponse.relayId
                relayIdRef.current = currentRelayId

                if (!isActiveRef.current) {
                    connection.publish(`${RELAY_UNSUBSCRIBE_PREFIX}.${currentRelayId}`)
                    inboxSub.unsubscribe()
                    return
                }

                setState(prev => ({
                    ...prev,
                    isSubscribed: true,
                    isSubscribing: false,
                }))

                console.log(`[messaging] Relay active: ${currentRelayId} → ${deliverInbox}`)

                ;(async () => {
                    for await (const msg of inboxSub) {
                        if (!isActiveRef.current) break

                        try {
                            const data = msg.json<T>()

                            setState(prev => ({ ...prev, messageCount: prev.messageCount + 1 }))

                            if (onMessageRef.current) {
                                await onMessageRef.current(data, msg)
                            }
                        } catch (error) {
                            console.error('[messaging] Error processing message:', error)
                        }
                    }
                })()
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error))
                console.error('[messaging] Subscription relay error:', err)
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
                    connection.publish(`${RELAY_UNSUBSCRIBE_PREFIX}.${currentRelayId}`)
                } catch {
                    // connection may be closed
                }
            }
            if (inboxSub) {
                inboxSub.unsubscribe()
            }
        }
    }, [enabled, isConnected, connection, topic])

    return {
        isSubscribed: state.isSubscribed,
        isSubscribing: state.isSubscribing,
        error: state.error,
        messageCount: state.messageCount,
        unsubscribe,
    }
}

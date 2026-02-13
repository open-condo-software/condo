import { JSONCodec, JsMsg, ConsumerMessages, NatsConnection } from 'nats.ws'
import { useEffect, useRef, useCallback, useState } from 'react'

interface ConsumerOptions {
    filterSubjects: string[]
    durable_name?: string
}

interface UseNatsSubscriptionOptions<T> {
    streamName: string
    subject: string
    connection: NatsConnection | null
    isConnected: boolean
    enabled?: boolean
    onMessage?: (data: T, msg: JsMsg) => void | Promise<void>
    autoAck?: boolean
    durableName?: string
}

interface NatsSubscriptionState {
    isSubscribed: boolean
    isSubscribing: boolean
    error: Error | null
    messageCount: number
}

export const useNatsSubscription = <T = unknown>(options: UseNatsSubscriptionOptions<T>) => {
    const {
        streamName,
        subject,
        connection,
        isConnected,
        enabled = true,
        onMessage,
        autoAck = true,
        durableName,
    } = options
    const [state, setState] = useState<NatsSubscriptionState>({
        isSubscribed: false,
        isSubscribing: false,
        error: null,
        messageCount: 0,
    })

    const subscriptionRef = useRef<ConsumerMessages | null>(null)
    const isActiveRef = useRef(true)
    const onMessageRef = useRef(onMessage)

    useEffect(() => {
        onMessageRef.current = onMessage
    }, [onMessage])

    const unsubscribe = useCallback(async () => {
        if (subscriptionRef.current) {
            try {
                await subscriptionRef.current.close()
                subscriptionRef.current = null
                setState(prev => ({ ...prev, isSubscribed: false }))
                console.log('[NATS] Unsubscribed from', subject)
            } catch (error) {
                console.error('[NATS] Error unsubscribing:', error)
            }
        }
    }, [subject])

    useEffect(() => {
        if (!enabled || !isConnected || !connection) {
            return
        }
        isActiveRef.current = true
        let subscription: ConsumerMessages | null = null

        const subscribe = async () => {
            try {
                setState(prev => ({ ...prev, isSubscribing: true, error: null }))

                const js = connection.jetstream()
                const jsonCodec = JSONCodec<T>()

                console.log(`[NATS] ✅ Subscribing to ${streamName}:${subject}`)

                const stream = await js.streams.get(streamName)
                const consumerOpts: ConsumerOptions = {
                    filterSubjects: [subject],
                }

                if (durableName) {
                    consumerOpts.durable_name = durableName
                }

                const consumer = await stream.getConsumer(consumerOpts)
                const messages = await consumer.consume()

                if (!isActiveRef.current) {
                    await messages.close()
                    return
                }

                subscription = messages
                subscriptionRef.current = messages

                setState(prev => ({
                    ...prev,
                    isSubscribed: true,
                    isSubscribing: false,
                }))

                console.log(`[NATS] 👂 Listening for messages on ${subject}`)

                ;(async () => {
                    for await (const msg of messages) {
                        console.log(`[NATS] 📨 Received message: ${msg.subject}`)
                        if (!isActiveRef.current) break

                        try {
                            const data = jsonCodec.decode(msg.data)

                            setState(prev => ({ ...prev, messageCount: prev.messageCount + 1 }))

                            if (onMessageRef.current) {
                                await onMessageRef.current(data, msg)
                            }

                            if (autoAck) {
                                msg.ack()
                            }
                        } catch (error) {
                            console.error('[NATS] Error processing message:', error)
                            msg.nak()
                        }
                    }
                })()
            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error))
                console.error('[NATS] Subscription error:', err)
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
            if (subscription) {
                subscription.close().catch((err: Error) => {
                    console.error('[NATS] Error closing subscription:', err)
                })
            }
        }
    }, [enabled, isConnected, connection, streamName, subject, autoAck, durableName])

    return {
        isSubscribed: state.isSubscribed,
        isSubscribing: state.isSubscribing,
        error: state.error,
        messageCount: state.messageCount,
        unsubscribe,
    }
}

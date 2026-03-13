import { wsconnect, NatsConnection } from '@nats-io/nats-core'
import { useEffect, useState, useCallback } from 'react'

interface UseMessagingConnectionOptions {
    enabled?: boolean
    autoConnect?: boolean
    wsUrl?: string
}

interface MessagingConnectionState {
    connection: NatsConnection | null
    isConnected: boolean
    isConnecting: boolean
    error: Error | null
}

type StateUpdater = (state: MessagingConnectionState) => void

let globalConnection: NatsConnection | null = null
let globalConnectionPromise: Promise<NatsConnection> | null = null
let globalUserId: string | null = null
let connectionRefCount = 0
let intentionalDisconnect = false
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
const MAX_RECONNECT_DELAY = 30000
const subscribers = new Set<StateUpdater>()

function notifySubscribers (state: MessagingConnectionState) {
    for (const setter of subscribers) {
        setter(state)
    }
}

function scheduleReconnect () {
    if (reconnectTimer) return
    const delay = Math.min(reconnectDelay, MAX_RECONNECT_DELAY)
    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null
        try {
            globalConnectionPromise = null
            const tokenResponse = await fetch('/messaging/token')
            if (!tokenResponse.ok) {
                throw new Error(`Failed to fetch messaging token: ${tokenResponse.status}`)
            }
            const { token, userId } = await tokenResponse.json()

            const nc = await wsconnect({
                servers: globalWsUrl || 'ws://localhost:8080',
                token,
                reconnect: true,
                maxReconnectAttempts: -1,
                reconnectTimeWait: 2000,
                reconnectJitter: 1000,
                pingInterval: 25_000,
            })

            globalConnection = nc
            globalUserId = userId || null
            reconnectDelay = 1000

            nc.closed().then((err) => {
                globalConnection = null
                globalConnectionPromise = null
                globalUserId = null
                notifySubscribers({
                    connection: null,
                    isConnected: false,
                    isConnecting: false,
                    error: err ? new Error(String(err)) : null,
                })
                if (!intentionalDisconnect && connectionRefCount > 0) {
                    scheduleReconnect()
                }
            })

            notifySubscribers({
                connection: nc,
                isConnected: true,
                isConnecting: false,
                error: null,
            })
        } catch (err) {
            console.error('[messaging] Reconnect failed, will retry:', err)
            reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY)
            scheduleReconnect()
        }
    }, delay)
}

let globalWsUrl: string | undefined

export const useMessagingConnection = (options: UseMessagingConnectionOptions = {}) => {
    const { enabled = true, autoConnect = true, wsUrl } = options
    const [state, setState] = useState<MessagingConnectionState>({
        connection: globalConnection,
        isConnected: !!globalConnection,
        isConnecting: false,
        error: null,
    })

    const connect = useCallback(async (): Promise<NatsConnection> => {
        if (globalConnection && !globalConnection.isClosed() && !globalConnection.isDraining()) {
            return globalConnection
        }

        if (globalConnectionPromise !== null) {
            return globalConnectionPromise
        }

        intentionalDisconnect = false
        globalWsUrl = wsUrl

        notifySubscribers({ connection: null, isConnected: false, isConnecting: true, error: null })

        globalConnectionPromise = (async () => {
            try {
                const tokenResponse = await fetch('/messaging/token')
                if (!tokenResponse.ok) {
                    throw new Error(`Failed to fetch messaging token: ${tokenResponse.status}`)
                }
                const { token, userId } = await tokenResponse.json()

                const nc = await wsconnect({
                    servers: wsUrl || 'ws://localhost:8080',
                    token,
                    reconnect: true,
                    maxReconnectAttempts: -1,
                    reconnectTimeWait: 2000,
                    reconnectJitter: 1000,
                    pingInterval: 25_000,
                })

                globalConnection = nc
                globalUserId = userId || null

                nc.closed().then((err) => {
                    globalConnection = null
                    globalConnectionPromise = null
                    globalUserId = null
                    notifySubscribers({
                        connection: null,
                        isConnected: false,
                        isConnecting: false,
                        error: err ? new Error(String(err)) : null,
                    })
                    if (!intentionalDisconnect && connectionRefCount > 0) {
                        scheduleReconnect()
                    }
                })

                reconnectDelay = 1000

                const connectedState: MessagingConnectionState = {
                    connection: nc,
                    isConnected: true,
                    isConnecting: false,
                    error: null,
                }
                notifySubscribers(connectedState)

                return nc
            } catch (error) {
                globalConnectionPromise = null
                const err = error instanceof Error ? error : new Error(String(error))
                console.error('[messaging] Connection error:', err)
                notifySubscribers({
                    connection: null,
                    isConnected: false,
                    isConnecting: false,
                    error: err,
                })
                throw err
            }
        })()

        return globalConnectionPromise
    }, [])

    const disconnect = useCallback(async () => {
        intentionalDisconnect = true
        if (reconnectTimer) {
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }
        if (globalConnection && !globalConnection.isClosed()) {
            await globalConnection.drain()
            await globalConnection.close()
            globalConnection = null
            globalConnectionPromise = null
        }
    }, [])

    useEffect(() => {
        if (!enabled) {
            return
        }

        subscribers.add(setState)
        connectionRefCount++

        if (autoConnect && globalConnection === null && globalConnectionPromise === null) {
            connect().catch(console.error)
        }

        return () => {
            subscribers.delete(setState)
            connectionRefCount--

            if (connectionRefCount === 0) {
                disconnect().catch(console.error)
            }
        }
    }, [enabled, autoConnect, connect, disconnect])

    return {
        connection: state.connection,
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        error: state.error,
        userId: globalUserId,
        connect,
        disconnect,
    }
}

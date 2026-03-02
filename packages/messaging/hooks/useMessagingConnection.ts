import { wsconnect, NatsConnection } from '@nats-io/nats-core'
import { useEffect, useRef, useState, useCallback } from 'react'

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

let globalConnection: NatsConnection | null = null
let globalConnectionPromise: Promise<NatsConnection> | null = null
let connectionRefCount = 0

export const useMessagingConnection = (options: UseMessagingConnectionOptions = {}) => {
    const { enabled = true, autoConnect = true, wsUrl } = options
    const [state, setState] = useState<MessagingConnectionState>({
        connection: globalConnection,
        isConnected: !!globalConnection,
        isConnecting: false,
        error: null,
    })
    const isMountedRef = useRef(true)

    const connect = useCallback(async (): Promise<NatsConnection> => {
        if (globalConnection && !globalConnection.isClosed() && !globalConnection.isDraining()) {
            return globalConnection
        }

        if (globalConnectionPromise !== null) {
            return globalConnectionPromise
        }

        setState(prev => ({ ...prev, isConnecting: true, error: null }))

        globalConnectionPromise = (async () => {
            try {
                const tokenResponse = await fetch('/messaging/token')
                if (!tokenResponse.ok) {
                    throw new Error(`Failed to fetch messaging token: ${tokenResponse.status}`)
                }
                const { token } = await tokenResponse.json()

                const nc = await wsconnect({
                    servers: wsUrl || 'ws://localhost:8080',
                    token,
                    reconnect: true,
                    maxReconnectAttempts: -1,
                    reconnectTimeWait: 2000,
                    pingInterval: 25_000,
                })

                globalConnection = nc

                nc.closed().then((err) => {
                    console.log('[messaging] Connection closed', err || '')
                    globalConnection = null
                    globalConnectionPromise = null
                    if (isMountedRef.current) {
                        setState({
                            connection: null,
                            isConnected: false,
                            isConnecting: false,
                            error: err ? new Error(String(err)) : null,
                        })
                    }
                })

                if (isMountedRef.current) {
                    setState({
                        connection: nc,
                        isConnected: true,
                        isConnecting: false,
                        error: null,
                    })
                }

                console.log('[messaging] Connected successfully')
                return nc
            } catch (error) {
                globalConnectionPromise = null
                const err = error instanceof Error ? error : new Error(String(error))
                console.error('[messaging] Connection error:', err)
                if (isMountedRef.current) {
                    setState({
                        connection: null,
                        isConnected: false,
                        isConnecting: false,
                        error: err,
                    })
                }
                throw err
            }
        })()

        return globalConnectionPromise
    }, [])

    const disconnect = useCallback(async () => {
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

        connectionRefCount++

        if (autoConnect && globalConnection === null && globalConnectionPromise === null) {
            connect().catch(console.error)
        }

        return () => {
            connectionRefCount--
            isMountedRef.current = false

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
        connect,
        disconnect,
    }
}

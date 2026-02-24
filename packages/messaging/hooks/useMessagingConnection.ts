import { wsconnect, ConnectionOptions, NatsConnection } from '@nats-io/nats-core'
import { useEffect, useRef, useState, useCallback } from 'react'

import { useOrganization } from '@open-condo/next/organization'

interface UseMessagingConnectionOptions {
    enabled?: boolean
    autoConnect?: boolean
}

interface MessagingConnectionState {
    connection: NatsConnection | null
    isConnected: boolean
    isConnecting: boolean
    error: Error | null
    allowedChannels: string[]
}

let globalConnection: NatsConnection | null = null
let globalConnectionPromise: Promise<NatsConnection> | null = null
let globalAllowedChannels: string[] = []
let connectionRefCount = 0

export const useMessagingConnection = (options: UseMessagingConnectionOptions = {}) => {
    const { enabled = true, autoConnect = true } = options
    const { organization } = useOrganization()
    const [state, setState] = useState<MessagingConnectionState>({
        connection: globalConnection,
        isConnected: !!globalConnection,
        isConnecting: false,
        error: null,
        allowedChannels: globalAllowedChannels,
    })
    const isMountedRef = useRef(true)

    const connect = useCallback(async (): Promise<NatsConnection> => {
        if (globalConnection && !globalConnection.isClosed()) {
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
                const { token, allowedChannels: channels } = await tokenResponse.json()
                globalAllowedChannels = channels || []

                const wsUrl = process.env.NEXT_PUBLIC_MESSAGING_WS_URL || 'ws://localhost:8080'

                const nc = await wsconnect({
                    servers: wsUrl,
                    token,
                    reconnect: true,
                    maxReconnectAttempts: -1,
                    reconnectTimeWait: 2000,
                    pingInterval: 25_000,
                } as ConnectionOptions)

                globalConnection = nc

                nc.closed().then((err) => {
                    console.log('[messaging] Connection closed', err || '')
                    globalConnection = null
                    globalConnectionPromise = null
                    globalAllowedChannels = []
                    if (isMountedRef.current) {
                        setState({
                            connection: null,
                            isConnected: false,
                            isConnecting: false,
                            error: err ? new Error(String(err)) : null,
                            allowedChannels: [],
                        })
                    }
                })

                if (isMountedRef.current) {
                    setState({
                        connection: nc,
                        isConnected: true,
                        isConnecting: false,
                        error: null,
                        allowedChannels: globalAllowedChannels,
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
                        allowedChannels: [],
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
        if (!enabled || !organization?.id) {
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
    }, [enabled, organization?.id, autoConnect, connect, disconnect])

    return {
        connection: state.connection,
        isConnected: state.isConnected,
        isConnecting: state.isConnecting,
        error: state.error,
        allowedChannels: state.allowedChannels,
        connect,
        disconnect,
    }
}

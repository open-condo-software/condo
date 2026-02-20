import { wsconnect, ConnectionOptions, NatsConnection } from '@nats-io/nats-core'
import { useEffect, useRef, useState, useCallback } from 'react'

import { useOrganization } from '@open-condo/next/organization'

interface UseNatsConnectionOptions {
    enabled?: boolean
    autoConnect?: boolean
}

interface NatsConnectionState {
    connection: NatsConnection | null
    isConnected: boolean
    isConnecting: boolean
    error: Error | null
    allowedStreams: string[]
}

let globalConnection: NatsConnection | null = null
let globalConnectionPromise: Promise<NatsConnection> | null = null
let globalAllowedStreams: string[] = []
let connectionRefCount = 0

export const useNatsConnection = (options: UseNatsConnectionOptions = {}) => {
    const { enabled = true, autoConnect = true } = options
    const { organization } = useOrganization()
    const [state, setState] = useState<NatsConnectionState>({
        connection: globalConnection,
        isConnected: !!globalConnection,
        isConnecting: false,
        error: null,
        allowedStreams: globalAllowedStreams,
    })
    const isMountedRef = useRef(true)

    const connect = useCallback(async (): Promise<NatsConnection> => {
        if (globalConnection && !globalConnection.isClosed()) {
            return globalConnection
        }

        if (globalConnectionPromise) {
            return globalConnectionPromise
        }

        setState(prev => ({ ...prev, isConnecting: true, error: null }))

        globalConnectionPromise = (async () => {
            try {
                const tokenResponse = await fetch('/nats/token')
                if (!tokenResponse.ok) {
                    throw new Error(`Failed to fetch NATS token: ${tokenResponse.status}`)
                }
                const { token, allowedStreams: streams } = await tokenResponse.json()
                globalAllowedStreams = streams || []

                const natsUrl = process.env.NEXT_PUBLIC_NATS_WS_URL || 'ws://localhost:8080'

                const nc = await wsconnect({
                    servers: natsUrl,
                    token,
                    reconnect: true,
                    maxReconnectAttempts: -1,
                    reconnectTimeWait: 2000,
                    pingInterval: 25_000,
                } as ConnectionOptions)

                globalConnection = nc

                nc.closed().then((err) => {
                    console.log('[NATS] Connection closed', err || '')
                    globalConnection = null
                    globalConnectionPromise = null
                    globalAllowedStreams = []
                    if (isMountedRef.current) {
                        setState({
                            connection: null,
                            isConnected: false,
                            isConnecting: false,
                            error: err ? new Error(String(err)) : null,
                            allowedStreams: [],
                        })
                    }
                })

                if (isMountedRef.current) {
                    setState({
                        connection: nc,
                        isConnected: true,
                        isConnecting: false,
                        error: null,
                        allowedStreams: globalAllowedStreams,
                    })
                }

                console.log('[NATS] Connected successfully')
                return nc
            } catch (error) {
                globalConnectionPromise = null
                const err = error instanceof Error ? error : new Error(String(error))
                console.error('[NATS] Connection error:', err)
                if (isMountedRef.current) {
                    setState({
                        connection: null,
                        isConnected: false,
                        isConnecting: false,
                        error: err,
                        allowedStreams: [],
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

        if (autoConnect && !globalConnection && !globalConnectionPromise) {
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
        allowedStreams: state.allowedStreams,
        connect,
        disconnect,
    }
}

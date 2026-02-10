import { useEffect, useRef } from 'react'

import type { CondoBridge, CondoBridgeSubscriptionListener } from '@open-condo/bridge'

export type ActionHandler = (actionId: string) => void
export type ActionHandlers = Partial<Record<string, ActionHandler>>

export function useActionHandlers (bridge: CondoBridge, handlers: ActionHandlers): void {
    const handlersRef = useRef<ActionHandlers>(handlers)

    useEffect(() => {
        handlersRef.current = handlers
    }, [handlers])

    useEffect(() => {
        const listener: CondoBridgeSubscriptionListener = (event) => {
            if (event.type !== 'CondoWebAppSendActionId') return

            if ('actionId' in event.data && typeof event.data.actionId === 'string') {
                const { actionId } = event.data
                const handler = handlersRef.current[actionId]
                handler?.(actionId)
            }
        }

        bridge.subscribe(listener)
        return () => {
            bridge.unsubscribe(listener)
        }
    }, [])
}

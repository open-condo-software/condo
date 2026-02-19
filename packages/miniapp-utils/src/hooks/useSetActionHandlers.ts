import { useEffect, useRef } from 'react'

import type { CondoBridge, CondoBridgeSubscriptionListener } from '@open-condo/bridge'

export type ActionHandler = (actionId: string) => void
export type ActionHandlers = Partial<Record<string, ActionHandler>>

/**
 * Subscribes to host action events and routes them to local handlers.
 *
 * Use it with host-provided actions that return `actionsIds` after configuration.
 * Those actions are rendered by the host in a platform-specific location
 * (e.g., bottom action bar on web or top-bar icons on mobile). Pass a map of
 * `{ [actionId]: handler }` so your miniapp can react to clicks on those actions.
 */
export function useSetActionHandlers (bridge: CondoBridge, handlers: ActionHandlers): void {
    const handlersRef = useRef<ActionHandlers>(handlers)

    useEffect(() => {
        handlersRef.current = handlers
    }, [handlers])

    useEffect(() => {
        const listener: CondoBridgeSubscriptionListener = (event) => {
            if (event.type !== 'CondoWebAppActionClickEvent') return

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
    }, [bridge])
}

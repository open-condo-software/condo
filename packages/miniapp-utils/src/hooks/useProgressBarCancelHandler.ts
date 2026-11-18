import { useEffect, useRef } from 'react'

import type { CondoBridge, CondoBridgeSubscriptionListener } from '@open-condo/bridge'

export function useProgressBarCancelHandler (bridge: CondoBridge, handler: () => void): void {
    const handlerRef = useRef(handler)

    useEffect(() => {
        handlerRef.current = handler
    }, [handler])

    useEffect(() => {
        const listener: CondoBridgeSubscriptionListener = (event) => {
            if (event.type === 'CondoWebAppProgressBarCancelEvent') {
                handlerRef.current()
            }
        }

        bridge.subscribe(listener)
        return () => {
            bridge.unsubscribe(listener)
        }
    }, [bridge])
}

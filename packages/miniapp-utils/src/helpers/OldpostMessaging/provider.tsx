import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { getEventDataSchema } from './utils'

import { omit } from '../collections'
import { generateUUIDv4 } from '../uuid'

type IFrameId = string
type IFrameRef = React.Ref<HTMLIFrameElement>

export type PostMessageContextType<KnownEventsByType extends Record<string, Array<string>>> = {
    addMessageSource: (frameRef: IFrameRef) => IFrameId
    removeMessageSource: (frameId: IFrameId) => void
    addEventHandler: <
        Params extends Record<string, unknown>,
        Result extends Record<string, unknown>,
        EventType extends keyof KnownEventsByType,
        EventName extends keyof KnownEventsByType[EventType],
    > (
        eventType: EventType,
        eventName: EventName,
        origin: string,
        paramsValidator: (params: Record<string, unknown>) => params is Params,
        handler: (params: Params) => Result | Promise<Result>
    ) => void
}

export type PostMessageProviderProps = {
    children?: React.ReactNode
}

// const _noEvents = {}

const PostMessageContext = React.createContext<Record<string, Array<string>>>({
    addMessageSource: () => generateUUIDv4(),
    removeMessageSource: () => {},
    addEventHandler: () => {},
})

export function PostMessageProvider<KnownEventsByType extends Record<string, Array<string>>> ({ children }: PostMessageProviderProps) {
    // Section 0. Global states
    const [, setRegisteredFrames] = useState<Record<IFrameId, IFrameRef>>({})
    const eventDataSchema = useMemo(() => getEventDataSchema(), [])

    // Section 1. Managing sources
    const addMessageSource = useCallback((frameRef: IFrameRef) => {
        const frameId = generateUUIDv4()
        setRegisteredFrames(prev => ({ ...prev, [frameId]: frameRef }))

        return frameId
    }, [])

    const removeMessageSource = useCallback((frameId: IFrameId) => {
        setRegisteredFrames(prev => omit(prev, frameId))
    }, [])

    const providerValue = useMemo(() => ({
        addMessageSource,
        removeMessageSource,
    }), [addMessageSource, removeMessageSource])

    // Section 2. Managing handlers
    const addEventHandler = useCallback(<
        EventParams extends Record<string, unknown>,
        EventResult extends Record<string, unknown>,
        EventType extends keyof KnownEventsByType>(
        eventType: EventType,
        eventName: keyof KnownEventsByType[EventType],
        origin: string,
        paramsValidator: (params: Record<string, unknown>) => params is EventParams,
        handler: (params: EventParams) => EventResult | Promise<EventResult>
    ) => {

    }, [])

    // Section 3. Event listeners
    const handleMessage = useCallback((event: MessageEvent) => {
        if (!event.isTrusted || !event.source || !('self' in event.source)) return

        const { data: message, success: isValidDataShape } = eventDataSchema.safeParse(event.data)

        // NOTE: filter out 3rd-party post-messages (debug, webpack, next and others) by validating its shape
        if (!isValidDataShape) return

        const { params, handler, type, version } = message
        const { requestId, ...otherParams } = params


    }, [eventDataSchema])

    // Section 4. Effects
    const hasWindow = typeof window !== 'undefined'
    useEffect(() => {
        if (hasWindow) {
            window.addEventListener('message', handleMessage)

            return () => {
                window.removeEventListener('message', handleMessage)
            }
        }
    }, [handleMessage, hasWindow])

    return (
        <PostMessageContext.Provider<KnownEventsByType> value={providerValue}>
            {children}
        </PostMessageContext.Provider>
    )
}
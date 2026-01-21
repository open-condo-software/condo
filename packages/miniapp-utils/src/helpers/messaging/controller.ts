import { z } from 'zod'

import { getClientErrorMessage } from './errors'
import { registerBridgeEvents } from './events/bridge'

import { generateUUIDv4 } from '../uuid'

import type { RegisterBridgeEventsOptions } from './events/bridge'
import type {
    FrameId,
    FrameType,
    EventType,
    EventName,
    EventParams,
    ParamsValidator,
    HandlerResult,
    Handler,
    HandlerMethods,
    HandlerScope,
    DataStorage,
    ControllerState,
} from './types'

// NOTE: taken from https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
const SEMVER_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/


const MESSAGE_SCHEMA = z.object({
    handler: z.string(),
    params: z.record(z.string(), z.unknown()).and(z.object({
        requestId: z.union([z.string(), z.number()]).optional(),
    })),
    type: z.string(),
    version: z.string().regex(SEMVER_REGEXP),
}).strict()

export class PostMessageController extends EventTarget {
    #registeredServiceWorkers: Record<FrameId, ServiceWorker> = {}
    #registeredFrames: Record<FrameId, FrameType> = {}
    #registeredHandlers: Record<HandlerScope, Record<EventType, Record<EventName, HandlerMethods<EventParams, HandlerResult>>>> = {}
    #storage: DataStorage = {}
    state: ControllerState = { isBridgeReady: false }

    constructor () {
        super()
        this.addFrame = this.addFrame.bind(this)
        this.tryAddServiceWorker = this.tryAddServiceWorker.bind(this)
        this.removeFrame = this.removeFrame.bind(this)
        this.addHandler = this.addHandler.bind(this)
        this.eventListener = this.eventListener.bind(this)
        this.registerBridgeEvents = this.registerBridgeEvents.bind(this)
    }

    private updateState (state: Partial<ControllerState>) {
        this.state = { ...this.state, ...state }
        this.dispatchEvent(new CustomEvent('statechange', { detail: this.state }))
    }

    addFrame (frame: FrameType): FrameId {
        const registeredFrame = Object.entries(this.#registeredFrames)
            .find(([, ref]) => ref === frame)
        if (registeredFrame) {
            return registeredFrame[0]
        }

        const frameId = generateUUIDv4()
        this.#registeredFrames[frameId] = frame
        return frameId
    }

    tryAddServiceWorker (): string | null {
        if (!('serviceWorker' in navigator) || !('controller' in navigator.serviceWorker) || !navigator.serviceWorker.controller) {
            return null
        }
        const sw = navigator.serviceWorker.controller
        const registeredServiceWorker = Object.entries(this.#registeredServiceWorkers)
            .find(([, ref]) => ref === sw)
        if (registeredServiceWorker) {
            return registeredServiceWorker[0]
        }
        const frameId = generateUUIDv4()
        this.#registeredServiceWorkers[frameId] = sw
        return frameId
    }

    removeFrame (frameId: FrameId) {
        delete this.#registeredFrames[frameId]
        delete this.#registeredHandlers[frameId]
    }

    addHandler<Params extends EventParams, Result extends HandlerResult>(
        eventType: EventType,
        eventName: EventName,
        handlerScope: HandlerScope,
        validator: ParamsValidator<Params>,
        handler: Handler<Params, Result>
    ) {
        if (!this.#registeredHandlers[handlerScope]) {
            this.#registeredHandlers[handlerScope] = {}
        }
        const scopedHandlers = this.#registeredHandlers[handlerScope]
        if (!scopedHandlers[eventType]) {
            scopedHandlers[eventType] = {}
        }
        const eventHandlers = scopedHandlers[eventType]
        eventHandlers[eventName] = { validator, handler } as HandlerMethods<EventParams, HandlerResult>
    }

    async #postMessage (source: Window | ServiceWorker, ...data: unknown[]) {
        if (source instanceof ServiceWorker) {
            return source.postMessage(data)
        }
        source.postMessage(...(data as Parameters<Window['postMessage']>))
    }

    #getRegisteredFrameByEventSource (source: Window | ServiceWorker) {
        if (source instanceof ServiceWorker) {
            const registeredWorker = Object.entries(this.#registeredServiceWorkers)
                .find(([, ref]) => ref === source)
            if (registeredWorker) {
                return {
                    frameId: registeredWorker[0],
                    frame: registeredWorker[1],
                }
            }
        } else {
            const registeredFrame = Object.entries(this.#registeredFrames)
                .find(([, ref]) => ref.contentWindow === source)
            if (registeredFrame) {
                return {
                    frameId: registeredFrame[0],
                    frame: registeredFrame[1],
                }
            }
        }
            
        return null
    }

    async eventListener (event: MessageEvent) {
        if (typeof window === 'undefined') return
        if (
            !event.isTrusted 
            || !event.source 
            || (
                !('self' in event.source) 
                && !(event.source instanceof ServiceWorker)
            )
        ) return
    
        const { success: isValidMessage, data: message } = MESSAGE_SCHEMA.safeParse(event.data)
        if (!isValidMessage) return

        const { handler: eventName, params: { requestId, ...handlerParams }, type: eventType } = message

        const source = event.source

        let frame: FrameType | ServiceWorker | undefined = undefined
        let frameId = 'parent'

        if (source !== window) {
            const registeredFrame = this.#getRegisteredFrameByEventSource(source)
            if (!registeredFrame) {
                return this.#postMessage(source,
                    getClientErrorMessage('ACCESS_DENIED', 0, 'Message was received from unregistered origin / iframe', requestId, eventName),
                    event.origin,
                )
            }
            frame = registeredFrame.frame
            frameId = registeredFrame.frameId
        }

        const handlerMethods = (
            this.#registeredHandlers[frameId]?.[eventType]?.[eventName]
            ?? this.#registeredHandlers['*']?.[eventType]?.[eventName]
            ?? {}
        )
        const { handler, validator } = handlerMethods
        if (!handler || !validator) {
            return this.#postMessage(source,
                getClientErrorMessage('UNKNOWN_METHOD', 2, 'Unknown method was provided. Make sure your runtime environment supports it.', requestId),
                event.origin,
            )
        }

        const validationResult = validator(handlerParams)
        if (!validationResult.success) {
            return this.#postMessage(source,
                getClientErrorMessage('INVALID_PARAMETERS', 3, validationResult.error, requestId, eventName),
                event.origin,
            )
        }

        const validatedParams = validationResult.data
        this.#storage[eventType] ??= new Map()
        const storage = this.#storage[eventType]

        try {
            const result = await handler(
                validatedParams, 
                storage,
                frame instanceof HTMLIFrameElement ? frame : undefined,
                frame instanceof ServiceWorker ? frame : undefined,
            )
            return this.#postMessage(source, {
                type: `${eventName}Result`,
                data: {
                    ...result,
                    requestId,
                },
            }, event.origin)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            return this.#postMessage(source,
                getClientErrorMessage('HANDLER_ERROR', 4, errorMessage, requestId, eventName),
                event.origin
            )
        }
    }

    registerBridgeEvents (options: Omit<RegisterBridgeEventsOptions, 'addHandler'>) {
        registerBridgeEvents({
            ...options,
            addHandler: this.addHandler,
        })
        this.updateState({ isBridgeReady: true })
    }
}
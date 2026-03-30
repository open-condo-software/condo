import { z } from 'zod'

import { getClientErrorMessage } from './errors'
import { registerBridgeEvents } from './events/bridge'
import { sortedMiddlewares, isServiceWorker, sendResponseMessage } from './utils'

import { generateUUIDv4 } from '../uuid'

import type { RegisterBridgeEventsOptions } from './events/bridge'
import type {
    ControllerState,
    DataStorage,
    EventName,
    EventParams,
    EventType,
    FrameId,
    RegisteredFrame,
    MessageSource,
    FrameType,
    Handler,
    HandlerMethods,
    HandlerResult,
    HandlerScope,
    Middleware,
    MiddlewareFn,
    MiddlewareId,
    ParamsValidator,
    RegisteredMiddleware,
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
    #registeredFrames: Record<FrameId, RegisteredFrame> = {}
    #registeredHandlers: Record<HandlerScope, Record<EventType, Record<EventName, HandlerMethods<EventParams, HandlerResult>>>> = {}
    #registeredMiddlewares: Record<HandlerScope, Array<RegisteredMiddleware<EventParams, HandlerResult>>> = {}
    #middlewaresIdsMap: Record<MiddlewareId, HandlerScope> = {}
    #storage: DataStorage = {}
    state: ControllerState = { isBridgeReady: false }

    constructor () {
        super()
        this.addFrame = this.addFrame.bind(this)
        this.removeFrame = this.removeFrame.bind(this)
        this.addHandler = this.addHandler.bind(this)
        this.eventListener = this.eventListener.bind(this)
        this.registerBridgeEvents = this.registerBridgeEvents.bind(this)
        this.addMiddleware = this.addMiddleware.bind(this)
        this.removeMiddleware = this.removeMiddleware.bind(this)
    }

    // ---- PRIVATE UTILITIES METHODS ----

    private updateState (state: Partial<ControllerState>) {
        this.state = { ...this.state, ...state }
        this.dispatchEvent(new CustomEvent('statechange', { detail: this.state }))
    }

    private getWrappedHandler (eventType: EventType, eventName: EventName, scope: HandlerScope, handler: Handler<EventParams, HandlerResult>): Handler<EventParams, HandlerResult> {
        const globalMiddlewares = (this.#registeredMiddlewares['*'] ?? [])
            .filter(mw =>
                (!mw.eventType || mw.eventType === eventType) &&
                (!mw.eventName || mw.eventName === eventName) &&
                (mw.scope === '*')
            )
        const scopedMiddlewares = (this.#registeredMiddlewares[scope] ?? [])
            .filter(mw =>
                (!mw.eventType || mw.eventType === eventType) &&
                (!mw.eventName || mw.eventName === eventName) &&
                (mw.scope === scope)
            )

        // NOTE: sort middlewares by execution order
        const middlewares = sortedMiddlewares([...globalMiddlewares, ...scopedMiddlewares])

        return middlewares.reduce<Handler<EventParams, HandlerResult>>(
            (nextHandler, mw) => {
                return async (args) => {
                    return mw.fn({
                        ...args,
                        next: nextHandler,
                    })
                }
            },
            handler
        )
    }

    private getMessageSource (source: Window | ServiceWorker): MessageSource | null {
        if (isServiceWorker(source)) {
            if (source !== navigator.serviceWorker.controller) return null
            return {
                ref: source,
                id: 'worker',
                type: 'worker',
            }
        }
        if (source === window) {
            return {
                ref: source,
                id: 'parent',
                type: 'window',
            }
        }

        const registeredFrame = Object.entries(this.#registeredFrames)
            .find(([, frame]) => frame.ref.contentWindow === source)

        if (!registeredFrame) return null

        return {
            ref: registeredFrame[1].ref,
            id: registeredFrame[0],
            type: 'frame',
            metadata: registeredFrame[1].metadata,
        }
    }

    // ---- SOURCE REGISTRATION METHODS ----

    addFrame (frame: FrameType): FrameId {
        const registeredFrame = Object.entries(this.#registeredFrames)
            .find(([, existingFrame]) => existingFrame.ref === frame)
        if (registeredFrame) {
            return registeredFrame[0]
        }

        const frameId = generateUUIDv4()
        this.#registeredFrames[frameId] = { ref: frame }
        return frameId
    }

    removeFrame (frameId: FrameId) {
        delete this.#registeredFrames[frameId]
        delete this.#registeredHandlers[frameId]
        delete this.#registeredMiddlewares[frameId]
    }

    // ---- HANDLER REGISTRATION METHODS ----

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

    addMiddleware<Params extends EventParams, Result extends HandlerResult>(mw: Middleware<Params, Result>): MiddlewareId {
        const { scope } = mw
        if (!this.#registeredMiddlewares[scope]) {
            this.#registeredMiddlewares[scope] = []
        }
        const id = generateUUIDv4()
        this.#registeredMiddlewares[scope].push({
            ...mw,
            fn: mw.fn as MiddlewareFn<EventParams, HandlerResult>,
            id,
        })
        this.#middlewaresIdsMap[id] = scope

        return id
    }

    removeMiddleware (id: MiddlewareId): void {
        const scope = this.#middlewaresIdsMap[id]
        if (scope && this.#registeredMiddlewares[scope]) {
            this.#registeredMiddlewares[scope] = this.#registeredMiddlewares[scope].filter(mw => mw.id !== id)
        }
        delete this.#middlewaresIdsMap[id]
    }

    // ---- EVENT LISTENERS ----

    async eventListener (event: MessageEvent) {
        if (typeof window === 'undefined') return
        if (!event.isTrusted || !event.source || (!('self' in event.source) && !isServiceWorker(event.source))) return

        const { success: isValidMessage, data: message } = MESSAGE_SCHEMA.safeParse(event.data)
        if (!isValidMessage) return

        const { handler: eventName, params: { requestId, ...handlerParams }, type: eventType } = message

        const messageSource = this.getMessageSource(event.source)

        if (!messageSource) {
            return sendResponseMessage({
                data: getClientErrorMessage('ACCESS_DENIED', 0, 'Message was received from unregistered origin / iframe', requestId, eventName),
                target: event.source,
                origin: event.origin,
            })
        }

        const handlerMethods = (
            this.#registeredHandlers[messageSource.id]?.[eventType]?.[eventName]
            ?? this.#registeredHandlers['*']?.[eventType]?.[eventName]
            ?? {}
        )

        const { handler, validator } = handlerMethods
        if (!handler || !validator) {
            return sendResponseMessage({
                data: getClientErrorMessage('UNKNOWN_METHOD', 2, 'Unknown method was provided. Make sure your runtime environment supports it.', requestId),
                origin: event.origin,
                target: event.source,
            })
        }

        const validationResult = validator(handlerParams)
        if (!validationResult.success) {
            return sendResponseMessage({
                data: getClientErrorMessage('INVALID_PARAMETERS', 3, validationResult.error, requestId, eventName),
                origin: event.origin,
                target: event.source,
            })
        }

        const validatedParams = validationResult.data
        this.#storage[eventType] ??= new Map()
        const eventsStorage = this.#storage[eventType]
        const wrappedHandler = this.getWrappedHandler(eventType, eventName, messageSource.id, handler)

        try {
            const result = await wrappedHandler({
                eventType,
                eventName,
                params: validatedParams,
                storage: { events: eventsStorage },
                source: messageSource,
            })

            return sendResponseMessage({
                data: {
                    type: `${eventName}Result`,
                    data: {
                        ...result,
                        requestId,
                    },
                },
                target: event.source,
                origin: event.origin,
            })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)

            return sendResponseMessage({
                data: getClientErrorMessage('HANDLER_ERROR', 4, errorMessage, requestId, eventName),
                target: event.source,
                origin: event.origin,
            })
        }
    }

    // ---- COMMON HANDLERS METHODS ----

    registerBridgeEvents (options: Omit<RegisterBridgeEventsOptions, 'addHandler'>) {
        registerBridgeEvents({
            ...options,
            addHandler: this.addHandler,
        })
        this.updateState({ isBridgeReady: true })
    }
}
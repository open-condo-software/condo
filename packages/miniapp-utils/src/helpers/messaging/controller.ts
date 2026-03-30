import { z } from 'zod'

import { getClientErrorMessage } from './errors'
import { registerBridgeEvents } from './events/bridge'
import { sortedMiddlewares } from './utils'

import { generateUUIDv4 } from '../uuid'

import type { RegisterBridgeEventsOptions } from './events/bridge'
import type {
    ControllerState,
    DataStorage,
    EventName,
    EventParams,
    EventType,
    FrameId,
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
    #registeredFrames: Record<FrameId, FrameType> = {}
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

    removeFrame (frameId: FrameId) {
        delete this.#registeredFrames[frameId]
        delete this.#registeredHandlers[frameId]
        delete this.#registeredMiddlewares[frameId]
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

    #getWrappedHandler (eventType: EventType, eventName: EventName, scope: HandlerScope, handler: Handler<EventParams, HandlerResult>): Handler<EventParams, HandlerResult> {
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
                return async (params, storage, frame) => {
                    return mw.fn({
                        eventType,
                        eventName,
                        params,
                        storage,
                        frame,
                        next: nextHandler,
                    })
                }
            },
            handler
        )
    }

    async eventListener (event: MessageEvent) {
        if (typeof window === 'undefined') return
        if (!event.isTrusted || !event.source || !('self' in event.source)) return

        const { success: isValidMessage, data: message } = MESSAGE_SCHEMA.safeParse(event.data)
        if (!isValidMessage) return

        const { handler: eventName, params: { requestId, ...handlerParams }, type: eventType } = message

        const sourceWindow = event.source

        let frame: FrameType | undefined = undefined
        let frameId = 'parent'

        if (sourceWindow !== window) {
            const registeredFrame = Object.entries(this.#registeredFrames)
                .find(([, ref]) => ref.contentWindow === sourceWindow)

            if (!registeredFrame) {
                return sourceWindow.postMessage(
                    getClientErrorMessage('ACCESS_DENIED', 0, 'Message was received from unregistered origin / iframe', requestId, eventName),
                    event.origin,
                )
            }

            frameId = registeredFrame[0]
            frame = registeredFrame[1]
        }

        const handlerMethods = (
            this.#registeredHandlers[frameId]?.[eventType]?.[eventName]
            ?? this.#registeredHandlers['*']?.[eventType]?.[eventName]
            ?? {}
        )
        const { handler, validator } = handlerMethods
        if (!handler || !validator) {
            return sourceWindow.postMessage(
                getClientErrorMessage('UNKNOWN_METHOD', 2, 'Unknown method was provided. Make sure your runtime environment supports it.', requestId),
                event.origin,
            )
        }

        const validationResult = validator(handlerParams)
        if (!validationResult.success) {
            return sourceWindow.postMessage(
                getClientErrorMessage('INVALID_PARAMETERS', 3, validationResult.error, requestId, eventName),
                event.origin,
            )
        }

        const validatedParams = validationResult.data
        this.#storage[eventType] ??= new Map()
        const storage = this.#storage[eventType]
        const wrappedHandler = this.#getWrappedHandler(eventType, eventName, frameId, handler)

        try {
            const result = await wrappedHandler(validatedParams, storage, frame)
            return sourceWindow.postMessage({
                type: `${eventName}Result`,
                data: {
                    ...result,
                    requestId,
                },
            }, event.origin)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            return sourceWindow.postMessage(
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
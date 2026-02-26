import { z } from 'zod'

import { getClientErrorMessage } from './errors'
import { registerBridgeEvents } from './events/bridge'
import { isServiceWorker } from './utils'

import { generateUUIDv4 } from '../uuid'

import type { RegisterBridgeEventsOptions } from './events/bridge'
import type {
    SourceId,
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
    #registeredServiceWorkers: Record<SourceId, ServiceWorker> = {}
    #registeredFrames: Record<SourceId, FrameType> = {}
    #registeredHandlers: Record<HandlerScope, Record<EventType, Record<EventName, HandlerMethods<EventParams, HandlerResult>>>> = {}
    #storage: DataStorage = {}
    #isNewWorkerAutoConnectEnabled = false
    state: ControllerState = { isBridgeReady: false }

    constructor () {
        super()
        this.addFrame = this.addFrame.bind(this)
        this.removeFrame = this.removeFrame.bind(this)
        this.addServiceWorkerIfSupported = this.addServiceWorkerIfSupported.bind(this)
        this._onNewServiceWorker = this._onNewServiceWorker.bind(this)
        this.removeServiceWorker = this.removeServiceWorker.bind(this)
        this.addHandler = this.addHandler.bind(this)
        this.eventListener = this.eventListener.bind(this)
        this.registerBridgeEvents = this.registerBridgeEvents.bind(this)
    }

    private updateState (state: Partial<ControllerState>) {
        this.state = { ...this.state, ...state }
        this.dispatchEvent(new CustomEvent('statechange', { detail: this.state }))
    }

    addFrame (frame: FrameType): SourceId {
        const registeredFrame = Object.entries(this.#registeredFrames)
            .find(([, ref]) => ref === frame)
        if (registeredFrame) {
            return registeredFrame[0]
        }

        const frameId = generateUUIDv4()
        this.#registeredFrames[frameId] = frame
        return frameId
    }

    removeFrame (frameId: SourceId) {
        delete this.#registeredFrames[frameId]
        delete this.#registeredHandlers[frameId]
    }

    addServiceWorkerIfSupported ({ enableNewWorkerInstanceAutoConnect = false }: { enableNewWorkerInstanceAutoConnect?: boolean }): SourceId | null {
        if (typeof navigator !== 'undefined' && !('serviceWorker' in navigator) || !('controller' in navigator.serviceWorker) || !navigator.serviceWorker.controller) {
            return null
        }
        const sw = navigator.serviceWorker.controller
        const registeredServiceWorker = Object.entries(this.#registeredServiceWorkers)
            .find(([, ref]) => ref === sw)
        if (registeredServiceWorker) {
            return registeredServiceWorker[0]
        }
        const senderId = Object.keys(this.#registeredServiceWorkers)[0] || generateUUIDv4()
        this.#registeredServiceWorkers = { [senderId]: sw }

        if (enableNewWorkerInstanceAutoConnect) {
            this.#isNewWorkerAutoConnectEnabled = true
            navigator.serviceWorker.addEventListener('controllerchange', this._onNewServiceWorker)
        }

        return senderId
    }

    _onNewServiceWorker () {
        this.addServiceWorkerIfSupported({ enableNewWorkerInstanceAutoConnect: false })
    }

    removeServiceWorker () {
        if (this.#isNewWorkerAutoConnectEnabled) {
            navigator?.serviceWorker?.removeEventListener?.('controllerchange', this._onNewServiceWorker)
            this.#isNewWorkerAutoConnectEnabled = false
        }
        this.#registeredServiceWorkers = {}
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

    #getRegisteredSourceByEventSource (source: Window | ServiceWorker) {
        if (isServiceWorker(source)) {
            const registeredWorker = Object.entries(this.#registeredServiceWorkers)
                .find(([, ref]) => ref === source)
            if (registeredWorker) {
                return {
                    sourceId: registeredWorker[0],
                    sourceRef: registeredWorker[1],
                }
            }
        } else {
            const registeredFrame = Object.entries(this.#registeredFrames)
                .find(([, ref]) => ref.contentWindow === source)
            if (registeredFrame) {
                return {
                    sourceId: registeredFrame[0],
                    sourceRef: registeredFrame[1],
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
                !('self' in event.source) // not from iframe
                && !isServiceWorker(event.source) // not from worker
            )
        ) return
    
        const { success: isValidMessage, data: message } = MESSAGE_SCHEMA.safeParse(event.data)
        if (!isValidMessage) return

        const { handler: eventName, params: { requestId, ...handlerParams }, type: eventType } = message

        const source = event.source

        let sourceRef: FrameType | ServiceWorker | undefined = undefined
        let sourceId = 'parent'

        if (source !== window) {
            const registeredSourceRef = this.#getRegisteredSourceByEventSource(source)
            if (!registeredSourceRef) {
                return source.postMessage(
                    getClientErrorMessage('ACCESS_DENIED', 0, 'Message was received from unregistered origin / iframe', requestId, eventName),
                    { targetOrigin: event.origin },
                )
            }
            sourceRef = registeredSourceRef.sourceRef
            sourceId = registeredSourceRef.sourceId
        }

        const handlerMethods = (
            this.#registeredHandlers[sourceId]?.[eventType]?.[eventName]
            ?? this.#registeredHandlers['*']?.[eventType]?.[eventName]
            ?? {}
        )
        const { handler, validator } = handlerMethods
        if (!handler || !validator) {
            return source.postMessage(
                getClientErrorMessage('UNKNOWN_METHOD', 2, 'Unknown method was provided. Make sure your runtime environment supports it.', requestId),
                { targetOrigin: event.origin },
            )
        }

        const validationResult = validator(handlerParams)
        if (!validationResult.success) {
            return source.postMessage(
                getClientErrorMessage('INVALID_PARAMETERS', 3, validationResult.error, requestId, eventName),
                { targetOrigin: event.origin },
            )
        }

        const validatedParams = validationResult.data
        this.#storage[eventType] ??= new Map()
        const storage = this.#storage[eventType]

        try {
            const result = await handler(
                validatedParams, 
                storage,
                sourceRef,
            )
            return source.postMessage({
                type: `${eventName}Result`,
                data: {
                    ...result,
                    requestId,
                },
            }, { targetOrigin: event.origin })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            return source.postMessage(
                getClientErrorMessage('HANDLER_ERROR', 4, errorMessage, requestId, eventName),
                { targetOrigin: event.origin },
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
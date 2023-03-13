import Ajv from 'ajv'
import get from 'lodash/get'
import omit from 'lodash/omit'
import React, { useEffect, createContext, useState, useContext, useCallback } from 'react'
import { v4 as uuidV4 } from 'uuid'

import { ERROR_CODES } from './errors'
import {
    handleNotification,
    useLaunchParamsHandler,
    useShowProgressBarHandler,
    useGetActiveProgressBarsHandler,
    useUpdateProgressBarHandler,
    useRedirectHandler,
} from './globalHandlers'
import { validators } from './validators'

import type { ErrorReason } from './errors'
import type {
    AllRequestMethods,
    RequestHandler,
    ClientErrorResponse,
    RequestId,
    RequestIdType,
} from './types'
import type { ValidatorsType } from './validators'
import type { ValidateFunction } from 'ajv'

type HandlerId = '*' | 'parent' | string
type FrameId = string
type OriginHandlers = Partial<{ [Method in AllRequestMethods]: RequestHandler<Method> }>
type RegisterHandler = <Method extends AllRequestMethods>(
    event: Method,
    frameId: HandlerId,
    handler: RequestHandler<Method>
) => void

/**
 * Context definitions
 */
type IPostMessageContext = {
    registeredFrames: Readonly<Record<FrameId, React.Ref<HTMLIFrameElement>>>
    addFrame: (ref: React.Ref<HTMLIFrameElement>) => FrameId
    removeFrame: (id: FrameId) => void
    handlers: Readonly<Record<HandlerId, OriginHandlers>>
    addEventHandler: RegisterHandler
    validators: Readonly<ValidatorsType>
}

/**
 * Mocks in case Provider was not provided by DOM
 */
const PostMessageContext = createContext<IPostMessageContext>({
    registeredFrames: {},
    addFrame: () => null,
    removeFrame: () => ({}),
    handlers: {},
    addEventHandler: () => ({}),
    validators,
})

/**
 * Common incoming message pattern and its schema
 */
type MessageType = {
    handler: string
    params: RequestId & Record<string, unknown>
    type: 'condo-bridge' | 'condo-ui'
    version: string
}

const ajv = new Ajv()
const messageSchema = {
    type: 'object',
    properties: {
        handler: { type: 'string' },
        params: { type: 'object' },
        type: { type: 'string', enum: ['condo-bridge', 'condo-ui'] },
        version: { type: 'string', pattern: '^\\d+.\\d+.\\d+(?:-\\w+){0,1}$' },
    },
    required: ['handler', 'type', 'version', 'params'],
    additionalProperties: false,
}
const validateMessage: ValidateFunction<MessageType> = ajv.compile(messageSchema)

function getClientErrorMessage<Method extends AllRequestMethods> (
    reason: ErrorReason,
    message: string,
    requestId?: RequestIdType,
    method?: Method
): ClientErrorResponse<AllRequestMethods, ErrorReason> {
    return {
        type: method ? `${method}Error` : 'CondoWebAppCommonError',
        data: {
            errorType: 'client',
            errorCode: ERROR_CODES[reason],
            errorReason: reason,
            errorMessage: message,
            ...(typeof requestId !== 'undefined' ? { requestId } : null),
        },
    }
}

const initialHandlers: Record<HandlerId, OriginHandlers> = {
    '*': {
        CondoWebAppShowNotification: handleNotification,
    },
}

/**
 * Single place to handle all incoming postMessages from condo and its miniapps.
 * You can register global handler for all iframes by specifying "*" as id (Example: notification)
 * You can also register handler for parent window itself by specifying "parent" as id (Example: notification)
 * Or pass "per frame" handler (Example: window resize)
 * Provider takes care of 3 things:
 * 1. Making sure messages are trusted and coming from allowed Windows instances
 * 2. Making sure message can be handled and passing parameters are valid
 * 3. Handling errors thrown by individual handlers and converting it to corresponding postMessage response
 */
export const PostMessageProvider: React.FC = ({ children }) => {
    const [registeredFrames, setRegisteredFrames] = useState<Record<FrameId, React.Ref<HTMLIFrameElement>>>({})
    const [registeredHandlers, setRegisteredHandlers] = useState<Record<HandlerId, OriginHandlers>>(initialHandlers)
    const isOnClient = typeof window !== 'undefined'

    const addEventHandler: RegisterHandler = useCallback((event, origin, handler) => {
        setRegisteredHandlers(prev => {
            return {
                ...prev,
                [origin]: {
                    ...prev[origin],
                    [event]: handler,
                },
            }
        })
    }, [])

    const launchParamsHandler = useLaunchParamsHandler()
    const showProgressBarHandler = useShowProgressBarHandler()
    const getActiveProgressBarsHandler = useGetActiveProgressBarsHandler()
    const updateProgressBarHandler = useUpdateProgressBarHandler()
    const redirectHandler = useRedirectHandler()

    useEffect(() => {
        addEventHandler('CondoWebAppGetLaunchParams', '*', launchParamsHandler)
    }, [addEventHandler, launchParamsHandler])

    useEffect(() => {
        addEventHandler('CondoWebAppShowProgressBar', '*', showProgressBarHandler)
    }, [addEventHandler, showProgressBarHandler])

    useEffect(() => {
        addEventHandler('CondoWebAppGetActiveProgressBars', '*', getActiveProgressBarsHandler)
    }, [addEventHandler, getActiveProgressBarsHandler])

    useEffect(() => {
        addEventHandler('CondoWebAppUpdateProgressBar', '*', updateProgressBarHandler)
    }, [addEventHandler, updateProgressBarHandler])

    useEffect(() => {
        addEventHandler('CondoWebAppRedirect', '*', redirectHandler)
    }, [addEventHandler, redirectHandler])

    const addFrame = useCallback((ref: React.Ref<HTMLIFrameElement>) => {
        const frameId = uuidV4()
        setRegisteredFrames((prev) => ({ ...prev, [frameId]: ref }))
        
        return frameId
    }, [])

    const removeFrame = useCallback((frameId: string) => {
        setRegisteredFrames((prev) => omit(prev, frameId))
        setRegisteredHandlers((prev) => omit(prev, frameId))
    }, [])

    const handleMessage = useCallback((event: MessageEvent) => {
        if (!event.isTrusted ||
            !event.source ||
            event.source instanceof ServiceWorker ||
            event.source instanceof MessagePort) {
            return
        }

        // If not valid message interface - skip. It can be system events, like webpack or some other legacy messages
        if (validateMessage(event.data)) {
            const message = event.data
            const { requestId, ...params } = message.params
            const origin = event.origin
            // Validator keys contains all handlers, so string cast can be performed safely
            const method: AllRequestMethods | undefined = Object.keys(validators).includes(message.handler)
                ? message.handler as AllRequestMethods
                : undefined

            if (!method) {
                return event.source.postMessage(
                    getClientErrorMessage('UNKNOWN_METHOD', 'Unknown method was provided. Make sure your runtime environment supports it.', requestId),
                    event.origin,
                )
            }

            const sourceWindow = event.source
            let frameId = 'parent'

            if (typeof window !== 'undefined' && sourceWindow !== window) {
                const registeredFrame = Object.entries(registeredFrames)
                    .find(([, ref]) => get(ref, ['current', 'contentWindow']) === sourceWindow)

                if (!registeredFrame) {
                    return event.source.postMessage(
                        getClientErrorMessage('ACCESS_DENIED', 'Message was received from unregistered origin', requestId),
                        event.origin,
                    )
                }

                frameId = registeredFrame[0]
            }

            const localHandler = get(registeredHandlers, [frameId, method])
            const globalHandler = get(registeredHandlers, ['*', method])
            const handler = localHandler || globalHandler as RequestHandler<typeof method>
            if (!handler) {
                return event.source.postMessage(
                    getClientErrorMessage('UNKNOWN_ERROR', 'There\'s no handler for this type of event. This is most likely a bug. We would be glad if you let us know about it', requestId),
                    event.origin
                )
            }

            const validator = validators[method]
            if (validator(params)) {
                try {
                    const result = handler(params, origin)
                    return event.source.postMessage({
                        type: `${method}Result`,
                        data: {
                            ...result,
                            ...(typeof requestId !== 'undefined' ? { requestId } : null),
                        },
                    }, event.origin)
                } catch (err) {
                    return event.source.postMessage(
                        getClientErrorMessage('HANDLER_ERROR', err.message, requestId, method),
                        event.origin
                    )
                }
            } else {
                return event.source.postMessage(
                    getClientErrorMessage('INVALID_PARAMETERS', JSON.stringify(validator.errors), requestId, method),
                    event.origin
                )
            }
        }
    }, [registeredHandlers, registeredFrames])

    useEffect(() => {
        if (isOnClient) {
            window.addEventListener('message', handleMessage)

            return () => window.removeEventListener('message', handleMessage)
        }
    }, [isOnClient, handleMessage])

    return (
        <PostMessageContext.Provider value={{
            registeredFrames,
            addFrame,
            removeFrame,
            handlers: registeredHandlers,
            addEventHandler,
            validators,
        }}>
            {children}
        </PostMessageContext.Provider>
    )
}

export const usePostMessageContext = (): IPostMessageContext => useContext(PostMessageContext)
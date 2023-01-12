import React, { useEffect, createContext, useState, useContext, useCallback } from 'react'
import Ajv from 'ajv'
import type { JSONSchemaType } from 'ajv'
import getConfig from 'next/config'
import type { AllRequestMethods, RequestParams, RequestHandler } from './types'
import { validators } from './validators'
import type { ValidatorsType } from './validators'

const {
    publicRuntimeConfig: {
        serverUrl,
    },
} = getConfig()

type HandlerOrigin = '*' | string
type OriginHandlers = Partial<{ [Method in AllRequestMethods]: RequestHandler<Method> }>
type RegisterHandler = <Method extends AllRequestMethods>(
    event: Method,
    origin: '*' | string,
    paramsSchema: JSONSchemaType<RequestParams<Method>>,
    handler: RequestHandler<Method>
) => void

type IPostMessageContext = {
    allowedOrigins: Readonly<Array<string>>
    handlers: Readonly<Record<HandlerOrigin, OriginHandlers>>
    registerHandler: RegisterHandler
    validators: Readonly<ValidatorsType>
}

const PostMessageContext = createContext<IPostMessageContext>({
    allowedOrigins: [serverUrl],
    handlers: {},
    registerHandler: () => ({}),
    validators,
})

type MessageType = {
    handler: string
    params: Record<string, unknown>
    type: 'condo-bridge' | 'condo-ui'
    version: string
}

const ajv = new Ajv()
const messageSchema: JSONSchemaType<MessageType> = {
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
const validateMessage = ajv.compile(messageSchema)

/**
 * Single place to handle all incoming postMessages from condo and its miniapps.
 * Checks that message has correct type and sender, then emit
 * Possible sources: condo-bridge, condo-ui
 */
export const PostMessageProvider: React.FC = ({ children }) => {
    const [allowedOrigins] = useState<Array<string>>([serverUrl])
    const [registeredHandlers, setRegisteredHandlers] = useState<Record<HandlerOrigin, OriginHandlers>>({})
    const isOnClient = typeof window !== 'undefined'

    const registerHandler: RegisterHandler = useCallback((event, origin, paramsSchema, handler) => {
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

    const handleMessage = useCallback((event: MessageEvent) => {
        if (!event.isTrusted) {
            return
        }

        // If not valid message interface - skip. It can be system events, like webpack or some other legacy messages
        if (validateMessage(event.data)) {
            const message = event.data
            console.log(message)
        }
    }, [])

    useEffect(() => {
        if (isOnClient) {
            window.addEventListener('message', handleMessage)

            return () => window.removeEventListener('message', handleMessage)
        }
    }, [isOnClient, handleMessage])

    return (
        <PostMessageContext.Provider value={{ allowedOrigins, handlers: registeredHandlers, registerHandler, validators }}>
            {children}
        </PostMessageContext.Provider>
    )
}

export const usePostMessageContext = (): IPostMessageContext => useContext(PostMessageContext)
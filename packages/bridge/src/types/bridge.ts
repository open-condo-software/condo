import type { RequestMethodsParamsMap, ResultResponseDataMap, ResponseEventNamesMap } from './methods'

export type AnyRequestMethodName = keyof RequestMethodsParamsMap
export type AnyResponseMethodName = keyof ResultResponseDataMap

export type RequestParams<Method extends AnyRequestMethodName> = RequestMethodsParamsMap[Method]
export type RequestIdType = string
export type RequestId = { requestId?: RequestIdType }

export type BaseResponseEvent<ResponseType extends string, Data> = {
    type: ResponseType,
    data: Data
}

export type ResultResponseEventName<Method extends AnyResponseMethodName> = ResponseEventNamesMap[Method]['result']
export type ResultResponseData<Method extends AnyResponseMethodName> = ResultResponseDataMap[Method]
export type ErrorResponseEventName<Method extends AnyResponseMethodName> = ResponseEventNamesMap[Method]['error']
// TODO(DOMA-5086): Add error codes mechanism?
export type ClientErrorResponseData = {
    errorType: 'client',
    errorMessage: string
}
export type ErrorResponseData = ClientErrorResponseData

export type CondoBridgeResultResponseEvent<Method extends AnyResponseMethodName> = BaseResponseEvent<ResultResponseEventName<Method>, ResultResponseData<Method>>
export type CondoBridgeErrorResponseEvent<Method extends AnyResponseMethodName> = BaseResponseEvent<ErrorResponseEventName<Method>, ErrorResponseData>
export type CondoBridgeResponseEvent<Method extends AnyResponseMethodName> = CondoBridgeResultResponseEvent<Method> | CondoBridgeErrorResponseEvent<Method>
export type CondoBridgeSubscriptionListener = (event: CondoBridgeResponseEvent<AnyResponseMethodName>) => void

export type WebBridge = {
    postMessage?: (message: unknown, targetOrigin: string) => void
}

export interface CondoBridge {
    send: <Method extends AnyRequestMethodName>(
        method: Method,
        params?: RequestParams<Method> & RequestId
    ) => void
    supports: <Method extends AnyRequestMethodName>(method: Method) => boolean
    subscribe: (listener: CondoBridgeSubscriptionListener) => void
    unsubscribe: (listener: CondoBridgeSubscriptionListener) => void
}

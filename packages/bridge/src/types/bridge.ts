import type { ErrorCode, ErrorReason } from './errors'
import type { IncomingEventsDataMap, IncomingEventNamesMap } from './incoming-events'
import type { RequestMethodsParamsMap, ResultResponseDataMap, ResponseEventNamesMap } from './methods'

export type AnyRequestMethodName = keyof RequestMethodsParamsMap
export type AnyResponseMethodName = keyof ResultResponseDataMap
export type AnyIncomingEventName = keyof IncomingEventsDataMap

export type RequestParams<Method extends AnyRequestMethodName> = RequestMethodsParamsMap[Method]
export type IncomingEventData<Method extends AnyIncomingEventName> = IncomingEventsDataMap[Method]
export type IncomingEventName<Method extends AnyIncomingEventName> = IncomingEventNamesMap[Method]
export type RequestIdType = string | number
export type RequestId = { requestId?: RequestIdType }

export type BaseResponseEvent<ResponseType extends string, Data> = {
    type: ResponseType
    data: Data
}

export type BaseIncomingEvent<EventType extends string, Data> = {
    type: EventType
    data: Data
}

export type ResultResponseEventName<Method extends AnyRequestMethodName> = ResponseEventNamesMap[Method]['result']
export type ResultResponseData<Method extends AnyResponseMethodName> = ResultResponseDataMap[Method]
export type ErrorResponseEventName<Method extends AnyResponseMethodName> = ResponseEventNamesMap[Method]['error']
export type ClientErrorResponseData<Reason extends ErrorReason> = {
    errorType: 'client'
    errorReason: Reason
    errorCode: ErrorCode<Reason>
    errorMessage: string
}
export type ErrorResponseData = ClientErrorResponseData<ErrorReason>

export type CondoBridgeResultResponseEvent<Method extends AnyResponseMethodName> = BaseResponseEvent<ResultResponseEventName<Method>, ResultResponseData<Method> & RequestId>
export type CondoBridgeErrorResponseEvent<Method extends AnyResponseMethodName> = BaseResponseEvent<ErrorResponseEventName<Method>, ErrorResponseData & RequestId>
export type CondoBridgeResponseEvent<Method extends AnyResponseMethodName> = CondoBridgeResultResponseEvent<Method> | CondoBridgeErrorResponseEvent<Method>
export type CondoBridgeIncomingEvent<Event extends AnyIncomingEventName> = BaseIncomingEvent<IncomingEventName<Event>, IncomingEventData<Event>>
export type CondoBridgeSubscriptionEvent = CondoBridgeResponseEvent<AnyResponseMethodName> | CondoBridgeIncomingEvent<AnyIncomingEventName>
export type CondoBridgeSubscriptionListener = (event: CondoBridgeSubscriptionEvent) => void

export type WebBridge = {
    postMessage?: (message: unknown, targetOrigin: string) => void
}

export type PromisifiedSendType = <Method extends AnyRequestMethodName>(
    method: Method,
    params?: RequestParams<Method> & RequestId,
    timeout?: number
) => Promise<Method extends AnyResponseMethodName ? ResultResponseData<Method> : void>

export interface CondoBridge {
    send: PromisifiedSendType
    supports: <Method extends AnyRequestMethodName>(method: Method) => boolean
    subscribe: (listener: CondoBridgeSubscriptionListener) => void
    unsubscribe: (listener: CondoBridgeSubscriptionListener) => void
}

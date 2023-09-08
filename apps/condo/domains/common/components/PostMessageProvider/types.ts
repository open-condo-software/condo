import type { ErrorCode, ErrorReason } from '@open-condo/bridge'
import type { 
    RequestParams as BridgeRequestParams,
    ResultResponseData as BridgeResponseData,
    ResponseEventNamesMap as BridgeEventNamesMap,
    AnyRequestMethodName as BridgeRequestMethodsName,
    AnyResponseMethodName as BridgeResponseMethodsName,
} from '@open-condo/bridge/src'
import type { AnalyticsParams } from '@open-condo/ui/src/components/_utils/analytics'

import type { ValidateFunction } from 'ajv'

export const COMMON_ERROR_PREFIX = 'CondoWebAppCommonError' as const

export type RequestParamsMap = {
    [Method in BridgeRequestMethodsName]: BridgeRequestParams<Method>
} & {
    CondoWebSendAnalyticsEvent: AnalyticsParams,
    CondoWebSetActiveCall: { isCallActive: boolean, connectedTickets: Array<string>, error?: string },
    CondoWebAppSetActiveCall: { callId: string | null },
    CondoWebAppSaveCallRecord: {
        callId: string,
        fileUrl: string,
        startedAt: string,
        callerPhone: string,
        destCallerPhone: string,
        talkTime: number,
        isIncomingCall: boolean,
    },
}

export type HandlerResultsMap = {
    [Method in BridgeResponseMethodsName]: BridgeResponseData<Method>
} & {
    CondoWebSendAnalyticsEvent: { sent: boolean },
    CondoWebSetActiveCall: { sent: boolean },
    CondoWebAppSetActiveCall: { sent: boolean },
    CondoWebAppSaveCallRecord: { sent: boolean },
}

export type AllRequestMethods = keyof RequestParamsMap
export type RequestParams<Method extends AllRequestMethods> = RequestParamsMap[Method]
export type HandlerResult<Method extends AllRequestMethods> = HandlerResultsMap[Method]
export type RequestHandler<Method extends AllRequestMethods> = (params: RequestParams<Method>, origin: string, source: Window) => HandlerResult<Method> | Promise<HandlerResult<Method>>
export type RequestParamValidator<Method extends AllRequestMethods> = ValidateFunction<RequestParams<Method>>
export type RequestIdType = string | number
export type RequestId = { requestId?: RequestIdType }
type ResponseEventNames<Method extends AllRequestMethods> = Record<Method, {
    result: `${Method}Result`,
    error: `${Method}Error`
}>
export type ResponseEventNamesMap = BridgeEventNamesMap &
ResponseEventNames<'CondoWebSendAnalyticsEvent'> &
ResponseEventNames<'CondoWebSetActiveCall'> &
ResponseEventNames<'CondoWebAppSetActiveCall'> &
ResponseEventNames<'CondoWebAppSaveCallRecord'>

export type ClientErrorResponse<Method extends AllRequestMethods, Reason extends ErrorReason> = {
    type: ResponseEventNamesMap[Method]['error'] | typeof COMMON_ERROR_PREFIX
    data: {
        errorType: 'client'
        errorCode: ErrorCode<Reason>
        errorReason: Reason
        errorMessage: string
    } & RequestId
}
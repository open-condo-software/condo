import type { ValidateFunction } from 'ajv'
import type { ErrorCode, ErrorReason } from './errors'
import type { 
    RequestParams as BridgeRequestParams,
    ResultResponseData as BridgeResponseData,
    ResponseEventNamesMap as BridgeEventNamesMap,
    AnyRequestMethodName as BridgeRequestMethodsName,
    AnyResponseMethodName as BridgeResponseMethodsName,
} from '@open-condo/bridge'
import type { AnalyticsParams } from '@open-condo/ui/src/components/_utils/analytics'

export const COMMON_ERROR_PREFIX = 'CondoWebAppCommonError' as const

export type RequestParamsMap = {
    [Method in BridgeRequestMethodsName]: BridgeRequestParams<Method>
} & {
    CondoWebSendAnalyticsEvent: AnalyticsParams
}

export type HandlerResultsMap = {
    [Method in BridgeResponseMethodsName]: BridgeResponseData<Method>
} & {
    CondoWebSendAnalyticsEvent: { sent: boolean }
}

export type AllRequestMethods = keyof RequestParamsMap
export type RequestParams<Method extends AllRequestMethods> = RequestParamsMap[Method]
export type HandlerResult<Method extends AllRequestMethods> = HandlerResultsMap[Method]
export type RequestHandler<Method extends AllRequestMethods> = (params: RequestParams<Method>, origin: string) => HandlerResult<Method>
export type RequestParamValidator<Method extends AllRequestMethods> = ValidateFunction<RequestParams<Method>>
export type RequestIdType = string | number
export type RequestId = { requestId?: RequestIdType }
type ResponseEventNames<Method extends AllRequestMethods> = Record<Method, {
    result: `${Method}Result`,
    error: `${Method}Error`
}>
export type ResponseEventNamesMap = BridgeEventNamesMap &
ResponseEventNames<'CondoWebSendAnalyticsEvent'>

export type ClientErrorResponse<Method extends AllRequestMethods, Reason extends ErrorReason> = {
    type: ResponseEventNamesMap[Method]['error'] | typeof COMMON_ERROR_PREFIX
    data: {
        errorType: 'client'
        errorCode: ErrorCode<Reason>
        errorReason: Reason
        errorMessage: string
    } & RequestId
}
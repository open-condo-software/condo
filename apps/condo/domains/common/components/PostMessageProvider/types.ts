import type { ValidateFunction } from 'ajv'
import type { ErrorCode, ErrorReason } from './errors'

export const COMMON_ERROR_PREFIX = 'CondoWebAppCommonError' as const

// TODO(DOMA-5124): Inherit types from corresponding packages (bridge / ui) to reduce code duplication
//  after migrating to some monorepo dep-graph build tool, since currently rebuilding everything takes time
export type RequestParamsMap = {
    CondoWebAppResizeWindow: { height: number }
}

export type HandlerResultsMap = {
    CondoWebAppResizeWindow: { height: number }
}

export type AllRequestMethods = keyof RequestParamsMap
export type RequestParams<Method extends AllRequestMethods> = RequestParamsMap[Method]
export type HandlerResult<Method extends AllRequestMethods> = HandlerResultsMap[Method]
export type RequestHandler<Method extends AllRequestMethods> = (params: RequestParams<Method>) => HandlerResult<Method>
export type RequestParamValidator<Method extends AllRequestMethods> = ValidateFunction<RequestParams<Method>>
export type RequestIdType = string | number
export type RequestId = { requestId?: RequestIdType }
type ResponseEventNames<T extends AllRequestMethods, R extends string, E extends string> = Record<T, {
    result: R,
    error: E
}>
export type ResponseEventNamesMap = ResponseEventNames<'CondoWebAppResizeWindow', 'CondoWebAppResizeWindowResult', 'CondoWebAppResizeWindowError'>

export type ClientErrorResponse<Method extends AllRequestMethods, Reason extends ErrorReason> = {
    type: ResponseEventNamesMap[Method]['error'] | typeof COMMON_ERROR_PREFIX
    data: {
        errorType: 'client'
        errorCode: ErrorCode<Reason>
        errorReason: Reason
        errorMessage: string
    } & RequestId
}
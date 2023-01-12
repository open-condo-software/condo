import type { ValidateFunction } from 'ajv'

export type RequestParamsMap = {
    CondoWebAppResizeWindow: { height: number }
}

export type AllRequestMethods = keyof RequestParamsMap
export type RequestParams<Method extends AllRequestMethods> = RequestParamsMap[Method]
export type RequestHandler<Method extends AllRequestMethods> = (params: RequestParams<Method>) => Record<string, unknown>
export type RequestParamValidator<Method extends AllRequestMethods> = ValidateFunction<RequestParams<Method>>
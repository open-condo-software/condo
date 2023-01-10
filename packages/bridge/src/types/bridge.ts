import type { RequestMethodsParamsMap } from './methods'

export type AnyRequestMethodName = keyof RequestMethodsParamsMap
export type RequestParams<K extends AnyRequestMethodName = AnyRequestMethodName> = RequestMethodsParamsMap[K]
export type RequestIdParam = { requestId: string }

export type WebBridge = {
    postMessage?: (message: unknown, targetOrigin: string) => void
}

export interface CondoBridge {
    send: <K extends AnyRequestMethodName>(
        method: K,
        params?: RequestParams<K> & RequestIdParam
    ) => void
}
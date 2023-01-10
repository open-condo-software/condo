/**
 * Mapping for event -> request payload
 */
export type RequestMethodsParamsMap = {
    CondoWebAppResizeWindow: { height: number }
}

/**
 * Mapping for event -> response data (what method returns unwrapped)
 */
export type ResultResponseDataMap = {
    CondoWebAppResizeWindow: { height: number }
}

type ResponseEventNames<T extends keyof RequestMethodsParamsMap, R extends string, E extends string> = Record<T, {
    result: R,
    error: E
}>

/**
 * Mapping for event -> success / failed response names
 */
export type ResponseEventNamesMap = ResponseEventNames<'CondoWebAppResizeWindow', 'CondoWebAppResizeWindowResult', 'CondoWebAppResizeWindowError'>
export type ShowNotificationParams = {
    type: 'info' | 'warning' | 'error' | 'success'
    message: string
    description?: string
}

/**
 * Mapping for event -> request payload
 */
export type RequestMethodsParamsMap = {
    CondoWebAppResizeWindow: { height: number }
    CondoWebAppShowNotification: ShowNotificationParams
}

/**
 * Mapping for event -> response data (what method returns unwrapped)
 */
export type ResultResponseDataMap = {
    CondoWebAppResizeWindow: { height: number }
    CondoWebAppShowNotification: { success: boolean }
}

type ResponseEventNames<T extends keyof RequestMethodsParamsMap, R extends string, E extends string> = Record<T, {
    result: R,
    error: E
}>

/**
 * Mapping for event -> success / failed response names
 */
export type ResponseEventNamesMap = ResponseEventNames<'CondoWebAppResizeWindow', 'CondoWebAppResizeWindowResult', 'CondoWebAppResizeWindowError'> &
ResponseEventNames<'CondoWebAppShowNotification', 'CondoWebAppShowNotificationResult', 'CondoWebAppShowNotificationError'>
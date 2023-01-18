// Imports for usage here, reexports for accessibility from outside
import type { ShowNotificationParams } from './ShowNotification'
export type { ShowNotificationParams } from './ShowNotification'
import type { GetLaunchParamsData } from './GetLaunchParams'
export type { GetLaunchParamsData } from './GetLaunchParams'

/**
 * Mapping for event -> request payload
 */
export type RequestMethodsParamsMap = {
    CondoWebAppGetLaunchParams: Record<string, never>
    CondoWebAppResizeWindow: { height: number }
    CondoWebAppShowNotification: ShowNotificationParams
}

/**
 * Mapping for event -> response data (what method returns unwrapped)
 */
export type ResultResponseDataMap = {
    CondoWebAppGetLaunchParams: GetLaunchParamsData
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
ResponseEventNames<'CondoWebAppShowNotification', 'CondoWebAppShowNotificationResult', 'CondoWebAppShowNotificationError'> &
ResponseEventNames<'CondoWebAppGetLaunchParams', 'CondoWebAppGetLaunchParamsResult', 'CondoWebAppGetLaunchParamsError'>

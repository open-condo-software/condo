// Imports for usage here, reexports for accessibility from outside
import type { ShowNotificationParams } from './ShowNotification'
export type { ShowNotificationParams } from './ShowNotification'
import type { GetCurrentUserData } from './GetCurrentUser'
export type { GetCurrentUserData } from './GetCurrentUser'

/**
 * Mapping for event -> request payload
 */
export type RequestMethodsParamsMap = {
    CondoWebAppGetCurrentUser: Record<string, never>
    CondoWebAppResizeWindow: { height: number }
    CondoWebAppShowNotification: ShowNotificationParams
}

/**
 * Mapping for event -> response data (what method returns unwrapped)
 */
export type ResultResponseDataMap = {
    CondoWebAppGetCurrentUser: GetCurrentUserData
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
ResponseEventNames<'CondoWebAppGetCurrentUser', 'CondoWebAppGetCurrentUserResult', 'CondoWebAppGetCurrentUserError'>

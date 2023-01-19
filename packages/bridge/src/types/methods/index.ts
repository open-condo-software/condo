// Imports for usage here, reexports for accessibility from outside
import type { GetLaunchParamsParams, GetLaunchParamsData } from './GetLaunchParams'
export type { GetLaunchParamsParams, GetLaunchParamsData } from './GetLaunchParams'
import type { ResizeWindowParams, ResizeWindowData } from './ResizeWindow'
export type { ResizeWindowParams, ResizeWindowData } from './ResizeWindow'
import type { ShowNotificationParams, ShowNotificationData } from './ShowNotification'
export type { ShowNotificationParams, ShowNotificationData } from './ShowNotification'
import type { ShowProgressBarParams, ShowProgressBarData } from './ShowProgressBar'
export type { ShowProgressBarParams, ShowProgressBarData } from './ShowProgressBar'

/**
 * Mapping for event -> request payload
 */
export type RequestMethodsParamsMap = {

    CondoWebAppGetLaunchParams: GetLaunchParamsParams
    CondoWebAppResizeWindow: ResizeWindowParams
    CondoWebAppShowNotification: ShowNotificationParams
    CondoWebAppShowProgressBar: ShowProgressBarParams
}

/**
 * Mapping for event -> response data (what method returns unwrapped)
 */
export type ResultResponseDataMap = {
    CondoWebAppGetLaunchParams: GetLaunchParamsData
    CondoWebAppResizeWindow: ResizeWindowData
    CondoWebAppShowNotification: ShowNotificationData
    CondoWebAppShowProgressBar: ShowProgressBarData
}

type ResponseEventNames<Method extends keyof RequestMethodsParamsMap> = {
    result: `${Method}Result`
    error: `${Method}Error`
}

/**
 * Mapping for event -> success / failed response names
 */
export type ResponseEventNamesMap = { [Method in keyof RequestMethodsParamsMap]: ResponseEventNames<Method> }

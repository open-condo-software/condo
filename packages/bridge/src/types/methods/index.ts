// Imports for usage here
import type { GetFragmentParams, GetFragmentData } from './GetFragment'
import type { GetLaunchParamsParams, GetLaunchParamsData } from './GetLaunchParams'
import type { PopHistoryStateParams, PopHistoryStateData } from './historical/PopHistoryState'
import type { PushHistoryStateParams, PushHistoryStateData } from './historical/PushHistoryState'
import type { ReplaceHistoryStateParams, ReplaceHistoryStateData } from './historical/ReplaceHistoryState'
import type { CloseModalWindowParams, CloseModalWindowData } from './modals/CloseModalWindow'
import type { ShowModalWindowParams, ShowModalWindowData } from './modals/ShowModalWindow'
import type { UpdateModalWindowParams, UpdateModalWindowData } from './modals/UpdateModalWindow'
import type { GetActiveProgressBarsParams, GetActiveProgressBarsData } from './progress-bars/GetActiveProgressBars'
import type { ShowProgressBarParams, ShowProgressBarData } from './progress-bars/ShowProgressBar'
import type { UpdateProgressBarParams, UpdateProgressBarData } from './progress-bars/UpdateProgressBar'
import type { RedirectData, RedirectParams } from './Redirect'
import type { RequestAuthData, RequestAuthParams } from './RequestAuth'
import type { ResizeWindowParams, ResizeWindowData } from './ResizeWindow'
import type { SetPageActionsParams, SetPageActionsData } from './SetPageActions'
import type { ShowNotificationParams, ShowNotificationData } from './ShowNotification'
// Reexports for accessibility from outside
export type { CloseModalWindowParams, CloseModalWindowData } from './modals/CloseModalWindow'
export type { GetActiveProgressBarsParams, GetActiveProgressBarData, GetActiveProgressBarsData } from './progress-bars/GetActiveProgressBars'
export type { GetFragmentParams, GetFragmentData } from './GetFragment'
export type { GetLaunchParamsParams, GetLaunchParamsData } from './GetLaunchParams'
export type { PopHistoryStateParams, PopHistoryStateData } from './historical/PopHistoryState'
export type { PushHistoryStateParams, PushHistoryStateData } from './historical/PushHistoryState'
export type { RedirectData, RedirectParams } from './Redirect'
export type { ReplaceHistoryStateParams, ReplaceHistoryStateData } from './historical/ReplaceHistoryState'
export type { RequestAuthData, RequestAuthParams } from './RequestAuth'
export type { ResizeWindowParams, ResizeWindowData } from './ResizeWindow'
export type { ShowModalWindowParams, ShowModalWindowData } from './modals/ShowModalWindow'
export type { ShowNotificationParams, ShowNotificationData } from './ShowNotification'
export type { ShowProgressBarParams, ShowProgressBarData } from './progress-bars/ShowProgressBar'
export type { UpdateModalWindowParams, UpdateModalWindowData } from './modals/UpdateModalWindow'
export type { UpdateProgressBarParams, UpdateProgressBarData } from './progress-bars/UpdateProgressBar'
export type { SetPageActionsParams, SetPageActionsData } from './SetPageActions'

/**
 * Mapping for event -> request payload
 */
export type RequestMethodsParamsMap = {
    CondoWebAppCloseModalWindow: CloseModalWindowParams
    CondoWebAppGetActiveProgressBars: GetActiveProgressBarsParams
    CondoWebAppGetFragment: GetFragmentParams
    CondoWebAppGetLaunchParams: GetLaunchParamsParams
    CondoWebAppPopHistoryState: PopHistoryStateParams
    CondoWebAppPushHistoryState: PushHistoryStateParams
    CondoWebAppRedirect: RedirectParams
    CondoWebAppReplaceHistoryState: ReplaceHistoryStateParams
    CondoWebAppRequestAuth: RequestAuthParams
    CondoWebAppResizeWindow: ResizeWindowParams
    CondoWebAppSetPageActions: SetPageActionsParams
    CondoWebAppShowModalWindow: ShowModalWindowParams
    CondoWebAppShowNotification: ShowNotificationParams
    CondoWebAppShowProgressBar: ShowProgressBarParams
    CondoWebAppUpdateModalWindow: UpdateModalWindowParams
    CondoWebAppUpdateProgressBar: UpdateProgressBarParams
}

/**
 * Mapping for event -> response data (what method returns unwrapped)
 */
export type ResultResponseDataMap = {
    CondoWebAppCloseModalWindow: CloseModalWindowData
    CondoWebAppGetActiveProgressBars: GetActiveProgressBarsData
    CondoWebAppGetFragment: GetFragmentData
    CondoWebAppGetLaunchParams: GetLaunchParamsData
    CondoWebAppPopHistoryState: PopHistoryStateData
    CondoWebAppPushHistoryState: PushHistoryStateData
    CondoWebAppRequestAuth: RequestAuthData
    CondoWebAppRedirect: RedirectData
    CondoWebAppReplaceHistoryState: ReplaceHistoryStateData
    CondoWebAppResizeWindow: ResizeWindowData
    CondoWebAppSetPageActions: SetPageActionsData
    CondoWebAppShowModalWindow: ShowModalWindowData
    CondoWebAppShowNotification: ShowNotificationData
    CondoWebAppShowProgressBar: ShowProgressBarData
    CondoWebAppUpdateModalWindow: UpdateModalWindowData
    CondoWebAppUpdateProgressBar: UpdateProgressBarData
}


type ResponseEventNames<Method extends keyof RequestMethodsParamsMap> = {
    result: `${Method}Result`
    error: `${Method}Error`
}

/**
 * Mapping for event -> success / failed response names
 */
export type ResponseEventNamesMap = { [Method in keyof RequestMethodsParamsMap]: ResponseEventNames<Method> }

// Imports for usage here
import type { ActionClickData } from './ActionClick'
import type { BackButtonData } from './BackButton'
import type { HistoryPopStateData } from './HistoryPopState'

// Reexports for accessibility from outside
export type { ActionClickData } from './ActionClick'
export type { BackButtonData } from './BackButton'
export type { HistoryPopStateData } from './HistoryPopState'

export type IncomingEventsDataMap = {
    CondoWebAppActionClick: ActionClickData
    CondoWebAppBackButton: BackButtonData
    CondoWebAppHistoryPopState: HistoryPopStateData
}

export type IncomingEventNamesMap = { [Event in keyof IncomingEventsDataMap]: `${Event}Event` }

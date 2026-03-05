// Imports for usage here
import type { ActionClickData } from './ActionClick'
// Reexports for accessibility from outside
export type { ActionClickData } from './ActionClick'

export type IncomingEventsDataMap = {
    CondoWebAppActionClick: ActionClickData
}

export type IncomingEventNamesMap = { [Event in keyof IncomingEventsDataMap]: `${Event}Event` }

export type ITrackerLogEventType = { eventName: string, eventProperties: Record<string, unknown> }

/* Abstract class representing a tracking instance library, such as amplitude.js */
abstract class TrackerInstance {
    instance = null
    token: string
    configParams: Record<string, unknown>

    protected constructor (token: string, configParams: Record<string, unknown> = {}) {
        this.token = token
        this.configParams = configParams
    }

    abstract init (): void

    abstract logEvent ({ eventName, eventProperties }: ITrackerLogEventType): void
}

export default TrackerInstance

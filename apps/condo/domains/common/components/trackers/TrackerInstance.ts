export type ITrackerLogEventType = { eventName: string, eventProperties: Record<string, unknown> }

abstract class TrackerInstance {
    instance = null
    token: string
    configParams: Record<string, unknown>

    protected constructor (token: string, configParams: Record<string, unknown> = {}) {
        this.token = token
        this.configParams = configParams
    }

    abstract init (): void

    // abstract getProvider (children: ReactChildren): ReactElement
    abstract logEvent ({ eventName, eventProperties }: ITrackerLogEventType): void
}

export default TrackerInstance

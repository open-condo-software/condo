export type ITrackerLogEventType = { eventName: string, eventProperties: Record<string, unknown> }

abstract class TrackerInstance {
    token: string
    configParams: Record<string, unknown>

    protected constructor (token: string, configParams: Record<string, unknown> = {}) {
        this.token = token
        this.configParams = configParams
    }

    abstract init<InstanceType> (): InstanceType

    abstract getProvider (children: React.ReactChildren): React.ReactElement
    abstract logEvent ({ eventName, eventProperties }: ITrackerLogEventType): void
}

export default TrackerInstance

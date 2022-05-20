export type ITrackerLogEventType = { eventName: string, eventProperties: Record<string, unknown> }

/**
 * Abstract class representing a tracking instance library, such as amplitude.js
 * @abstract
 * @class TrackerInstance
 * @classdesc Should be implemented when new tracking library would be connected
 */
abstract class TrackerInstance {
    instance = null
    token: string
    configParams: Record<string, unknown>

    protected constructor (token: string, configParams: Record<string, unknown> = {}) {
        this.token = token
        this.configParams = configParams
    }

    /**
     * This method is called when the component is created
     * @abstract
     * @return void
     */
    abstract init (): void

    /**
     * Common method for sending data to tracker API
     * @abstract
     * @param {string} eventName - short event description
     * @param {Object} eventProperties - related properties
     * @return void
     */
    abstract logEvent ({ eventName, eventProperties }: ITrackerLogEventType): void
}

export default TrackerInstance

import getConfig from 'next/config'
import get from 'lodash/get'

export type ITrackerLogEventType = { eventName: string, eventProperties: Record<string, unknown> }

/**
 * Abstract class representing a tracking instance library, such as amplitude.js
 * @abstract
 * @class TrackerInstance
 * @classdesc Should be implemented when new tracking library would be connected
 * @param {string} instanceName string representation of tracker key inside environment runtime config
 */
abstract class TrackerInstance {
    protected readonly token: string | null = null
    protected readonly configParams: Record<string, unknown> = {}
    protected readonly instanceName: string
    protected instance = null

    protected constructor (instanceName: string) {
        this.instanceName = instanceName
        const config = getConfig()
        const trackingConfig = get(config, 'publicRuntimeConfig.trackingConfig')

        if (trackingConfig) {
            this.token = get(trackingConfig, ['trackers', this.instanceName, 'token'])
            this.configParams = get(trackingConfig, ['trackers', this.instanceName, 'config'])
        }
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

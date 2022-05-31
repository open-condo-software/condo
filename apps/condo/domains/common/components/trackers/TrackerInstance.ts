import getConfig from 'next/config'
import { get, compact } from 'lodash'
import { validate as uuidValidate } from 'uuid'

export type ITrackerLogEventType = {
    eventName: string
    eventProperties?: Record<string, unknown>
    denyDuplicates?: boolean
}

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
    protected readonly allowedDomains: Record<string, unknown> = {}
    protected readonly instanceName: string
    protected instance = null
    private prevEvent: string

    protected constructor (instanceName: string, localConfig?: Record<string, unknown>) {
        this.instanceName = instanceName
        const config = localConfig ? localConfig : getConfig()
        const trackingConfig = get(config, 'publicRuntimeConfig.trackingConfig')

        if (trackingConfig) {
            const token = get(trackingConfig, ['trackers', this.instanceName, 'token'])
            const configParams = get(trackingConfig, ['trackers', this.instanceName, 'config'])
            if (!token) {
                console.error(`No token for ${this.instanceName} tracker instance was provided!`)
            }

            this.token = token
            this.configParams = configParams
            this.allowedDomains = get(trackingConfig, 'domains', {})
        }
    }

    /**
     * This method is called when the component is created.
     * Should be wrapped at window object exists condition if it is necessary!
     * @abstract
     * @return void
     */
    abstract init (): void

    /**
     * Common method for sending data to tracker API
     * @abstract
     * @param {string} eventName - short event description
     * @param {Object} eventProperties - related properties
     * @param {Boolean} denyDuplicates - enable check for duplicated events on eventName prop comparison
     * @return void
     */
    abstract logEvent ({ eventName, eventProperties, denyDuplicates }: ITrackerLogEventType): void

    /**
     * Check for duplicated events by name and component path restrictions from app config
     * @param {Object} ITrackerLogEventType - object with eventName and eventProperties props
     * @return {boolean}
     */
    isNeedToSendEvent ({ eventName, eventProperties, denyDuplicates = false }: ITrackerLogEventType): boolean {
        let permission = false
        if (denyDuplicates) {
            if (this.prevEvent !== eventName) {
                this.prevEvent = eventName
                permission = this._isNeedToSendEvent(eventProperties)
            }
        } else {
            permission = this._isNeedToSendEvent(eventProperties)
        }

        return permission
    }

    private _isNeedToSendEvent ( eventProperties: Pick<ITrackerLogEventType, 'eventProperties'>): boolean  {
        let hasDomainLevelPermission = false
        if (this.allowedDomains) {
            const route = compact<string>(get(eventProperties, ['page', 'path'], '').split('/'))

            if (route.length === 1) {
                hasDomainLevelPermission = Object.keys(this.allowedDomains).some(pageRoute => route[0].includes(pageRoute))
            } else if (route.length === 2) {
                const currentDomainConfig = get(this.allowedDomains, route[0], []) as Array<string>
                const pageConfigName = uuidValidate(route[1]) ? 'id' : route[1]

                hasDomainLevelPermission = currentDomainConfig.indexOf(pageConfigName) !== -1
            } else if (route.length === 3) {
                const currentDomainConfig = get(this.allowedDomains, route[0], []) as Array<string>

                hasDomainLevelPermission = currentDomainConfig.some(pageRoute => route[2].includes(pageRoute))
            }
        }

        return Boolean(this.instance) && Boolean(this.token) && hasDomainLevelPermission
    }
}

export default TrackerInstance

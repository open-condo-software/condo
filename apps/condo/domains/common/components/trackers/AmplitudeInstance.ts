import getConfig from 'next/config'
import amplitude, { Identify } from 'amplitude-js'
import { getCurrentUserId } from '@condo/domains/common/utils/userid.utils'
import TrackerInstance, { ITrackerLogEventType } from './TrackerInstance'

class AmplitudeInstance extends TrackerInstance {
    public userId: string

    constructor () {
        const { publicRuntimeConfig: { amplitudeToken } } = getConfig()
        super(amplitudeToken)
    }

    init () {
        if (this.token && !this.instance) {
            const amplitudeInstance = amplitude.getInstance()

            const userId = getCurrentUserId()
            this.userId = userId

            amplitudeInstance.init(this.token, null, {
                userId,
                includeGclid: true,
                includeUtm: true,
            })

            if (amplitudeInstance.isNewSession()) {
                const visitor: Identify = new amplitudeInstance.Identify()
                visitor.setOnce('userId', userId)
                amplitudeInstance.identify(visitor)
            }
            this.instance = amplitudeInstance
        }
    }

    logEvent ({ eventName, eventProperties }: ITrackerLogEventType): void {
        if (this.instance && this.token) {
            this.instance.logEvent(eventName, eventProperties)
        }
    }
}

export default AmplitudeInstance

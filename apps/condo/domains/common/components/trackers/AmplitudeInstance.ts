import amplitude, { Identify } from 'amplitude-js'
import { getCurrentUserId } from '@condo/domains/common/utils/userid.utils'
import TrackerInstance, { ITrackerLogEventType } from './TrackerInstance'

const INSTANCE_NAME = 'amplitude'

class AmplitudeInstance extends TrackerInstance {
    public userId: string

    constructor () {
        super(INSTANCE_NAME)
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
                ...this.configParams,
            })

            if (amplitudeInstance.isNewSession()) {
                const visitor: Identify = new amplitudeInstance.Identify()
                visitor.setOnce('userId', userId)
                amplitudeInstance.identify(visitor)
            }
            this.instance = amplitudeInstance
        }
    }

    logEvent (trackerLogEventProps: ITrackerLogEventType): void {
        if (this.isNeedToSendEvent(trackerLogEventProps)) {
            console.log(`${trackerLogEventProps.eventName}`)
            // console.log('------')
            // this.instance.logEvent(trackerLogEventProps.eventName, trackerLogEventProps.eventProperties)
        }
    }
}

export default AmplitudeInstance

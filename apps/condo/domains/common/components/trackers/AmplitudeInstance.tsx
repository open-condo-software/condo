import React from 'react'
import getConfig from 'next/config'
import amplitude, { Identify } from 'amplitude-js'
import { getCurrentUserId } from '@condo/domains/common/utils/userid.utils'
import TrackerInstance, { ITrackerLogEventType } from './TrackerInstance'
import { useAmplitude, AmplitudeProvider } from '@condo/domains/common/utils/amplitudeUtils'

class AmplitudeInstance extends TrackerInstance {
    public amplitudeInstance
    public userId: string

    constructor () {
        const { publicRuntimeConfig: { amplitudeToken } } = getConfig()
        super(amplitudeToken)
    }

    getProvider (children: React.ReactChildren): React.ReactElement {
        if (!this.token || typeof window === 'undefined') {
            return <>{children}</>
        }

        return (
            <AmplitudeProvider amplitudeInstance={this.amplitudeInstance} apiKey={this.token} userId={this.userId}>
                {children}
            </AmplitudeProvider>
        )
    }

    init () {
        const amplitudeInstance = amplitude.getInstance()

        const userId = getCurrentUserId()
        this.userId = userId

        amplitudeInstance.init(this.token, null, {
            userId,
            includeReferrer: true,
            includeGclid: true,
            includeUtm: true,
        })

        if (amplitudeInstance.isNewSession()) {
            const visitor: Identify = new amplitudeInstance.Identify()
            visitor.setOnce('userId', userId)
            amplitudeInstance.identify(visitor)
        }
        this.amplitudeInstance = amplitudeInstance
        return amplitudeInstance
    }

    logEvent ({ eventName, eventProperties }: ITrackerLogEventType): void {
        const {} = useAmplitude()
    }

}

export default AmplitudeInstance

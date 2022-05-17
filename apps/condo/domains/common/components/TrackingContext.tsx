import React, { createContext, useContext } from 'react'
import { useRouter } from 'next/router'
import TrackerInstance from './trackers/TrackerInstance'
import AmplitudeInstance from './trackers/AmplitudeInstance'

interface ITrackingContext {
    eventProperties: Record<string, unknown>
    userProperties: Record<string, unknown>
    trackerInstances: Array<TrackerInstance>
}

const TrackingContext = createContext<ITrackingContext>({
    eventProperties: {},
    userProperties: {},
    trackerInstances: [],
})

const useTrackingContext = (): ITrackingContext => useContext<ITrackingContext>(TrackingContext)

const useTracking = () => {
    const {trackerInstances} = useTrackingContext()

    const logEvent = () => {
        // trackerInstances.map(tc => tc.logEvent())
        console.log('some app event log')
    }

    return {
        logEvent,
    }
}

const TrackingProvider: React.FC = ({ children }) => {
    const { asPath } = useRouter()
    const trackingProviderValue = {
        eventProperties: {
            page: {
                path: asPath,
            },
        },
        userProperties: {},
        trackerInstances: [new AmplitudeInstance()],
    }

    return (
        <TrackingContext.Provider value={trackingProviderValue}>
            {children}
        </TrackingContext.Provider>
    )
}

export { useTrackingContext, useTracking, TrackingProvider }

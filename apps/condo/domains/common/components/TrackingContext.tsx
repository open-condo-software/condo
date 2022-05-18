import React, { createContext, useContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import pick from 'lodash/pick'
import TrackerInstance, { ITrackerLogEventType } from './trackers/TrackerInstance'
import AmplitudeInstance from './trackers/AmplitudeInstance'

const TRACKING_INITIAL_VALUE = {
    trackerInstances: { amplitude: new AmplitudeInstance() },
}

interface ITrackingContext {
    eventProperties?: Record<string, unknown>
    userProperties?: Record<string, unknown>
    trackerInstances?: Record<string, TrackerInstance>
    setUserProperties? (newProps: Record<string, unknown>): void
    setEventProperties? (newProps: Record<string, unknown>): void
}

interface ILogEventTo extends ITrackerLogEventType {
    destination: Array<string>
}

const TrackingContext = createContext<ITrackingContext>(TRACKING_INITIAL_VALUE)

const useTrackingContext = (): ITrackingContext => useContext<ITrackingContext>(TrackingContext)

const useTracking = () => {
    const { trackerInstances, eventProperties, userProperties, setUserProperties, setEventProperties } = useTrackingContext()
    const logEvent = ({ eventName, eventProperties }: ITrackerLogEventType) => {
        Object.values(trackerInstances).map(trackerInstance => trackerInstance.logEvent({ eventName, eventProperties }))
    }

    const logEventTo = ({ eventName, eventProperties, destination }: ILogEventTo) => {
        Object.values(pick(trackerInstances, destination)).map(trackerInstance => trackerInstance.logEvent({ eventName, eventProperties }))
    }

    return {
        eventProperties,
        userProperties,
        trackerInstances,
        logEvent,
        logEventTo,
        setEventProperties,
        setUserProperties,
    }
}

const TrackingProvider: React.FC = ({ children }) => {
    const { asPath } = useRouter()
    //TODO: rewrite to ref
    const trackingProviderValue = {
        trackerInstances: TRACKING_INITIAL_VALUE.trackerInstances,
        eventProperties: {
            page: {
                path: asPath,
            },
        },
        userProperties: {},
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            Object.values(trackingProviderValue.trackerInstances).map(trackerInstance => trackerInstance.init())
        }
    }, [])

    const setUserProperties = (newProps) => {
        trackingProviderValue.userProperties = Object.assign(trackingProviderValue.userProperties, newProps)
    }

    const setEventProperties = (newProps) => {
        trackingProviderValue.eventProperties = Object.assign(trackingProviderValue.eventProperties, newProps)
    }

    return (
        <TrackingContext.Provider value={{
            eventProperties: trackingProviderValue.eventProperties,
            userProperties: trackingProviderValue.userProperties,
            trackerInstances: trackingProviderValue.trackerInstances,
            setUserProperties,
            setEventProperties,
        }}>
            {children}
        </TrackingContext.Provider>
    )
}

export { useTracking, TrackingProvider }

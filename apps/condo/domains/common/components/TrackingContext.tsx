import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import pick from 'lodash/pick'
import { TRACKING_USER_FIELDS } from '@condo/domains/user/constants'
import TrackerInstance, { ITrackerLogEventType } from './trackers/TrackerInstance'
import AmplitudeInstance from './trackers/AmplitudeInstance'

const TRACKING_INITIAL_VALUE = {
    // Here you should create app related tracker instances
    trackerInstances: { amplitude: new AmplitudeInstance() },
}

export type TrackingEventPropertiesType = {
    page?: {
        path: string
        state?: string
    }
}

type TrackingEventProperties = Record<string, unknown>

export interface ITrackingComponent {
    eventName?: string
    eventProperties?: Record<string, unknown>
}

interface ITrackingContext {
    trackerInstances: Record<string, TrackerInstance>
    eventProperties?: TrackingEventPropertiesType
    userProperties?: Record<string, unknown>
    setUserProperties? (newProps: Record<string, unknown>): void
    setEventProperties? (newProps: Record<string, unknown>): void
}

interface ILogEventTo extends ITrackerLogEventType {
    destination: Array<string>
}

const TrackingContext = createContext<ITrackingContext>(TRACKING_INITIAL_VALUE)

const useTrackingContext = (): ITrackingContext => useContext<ITrackingContext>(TrackingContext)

interface IUseTracking {
    (): {
        eventProperties: ITrackingContext['eventProperties']
        userProperties: Pick<ITrackingContext, 'userProperties'>
        logEvent: (logEventProps: ITrackerLogEventType) => void
        logEventTo: (logEventToProps: ILogEventTo) => void
        setEventProperties: (newProps: Record<string, unknown>) => void
        setUserProperties: (newProps: Record<string, unknown>) => void
    }
}

const useTracking: IUseTracking = () => {
    const { trackerInstances, eventProperties, userProperties, setUserProperties, setEventProperties } = useTrackingContext()

    const logEvent = ({ eventName, eventProperties }: ITrackerLogEventType) => {
        Object.values(trackerInstances).map(trackerInstance => trackerInstance.logEvent({ eventName, eventProperties }))
    }

    const logEventTo = ({ eventName, eventProperties, destination }: ILogEventTo) => {
        Object.values(pick(trackerInstances, destination)).map(trackerInstance => trackerInstance.logEvent({ eventName, eventProperties }))
    }

    const instrument = (eventName: string, func?: any) => {
        function fn (...params: any) {
            const retVal = func ? func(...params) : undefined
            logEvent({ eventName, eventProperties })
            return retVal
        }
        return fn as any
    }

    return {
        eventProperties,
        userProperties,
        logEvent,
        logEventTo,
        setEventProperties,
        setUserProperties,
    }
}

const TrackingProvider: React.FC = ({ children }) => {
    const { user } = useAuth()
    const { link } = useOrganization()
    const { asPath } = useRouter()

    const trackingProviderValueRef = useRef<ITrackingContext>({
        trackerInstances: TRACKING_INITIAL_VALUE.trackerInstances,
        userProperties: {},
        eventProperties: {
            page: {
                path: asPath,
            },
        },
        setUserProperties (newProps: Record<string, unknown>) {
            this.userProperties = Object.assign(this.userProperties, newProps)
        },
        setEventProperties (newProps: Record<string, unknown>) {
            this.eventProperties = Object.assign(this.eventProperties, newProps)
        },
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            Object.values(trackingProviderValueRef.current.trackerInstances).map(trackerInstance => trackerInstance.init())
        }
    }, [])

    // Collect user & organization related data to slice custom groups based on given attributes
    useEffect(() => {
        if (user) {
            trackingProviderValueRef.current.userProperties = pick(user, TRACKING_USER_FIELDS)

            if (link) {
                trackingProviderValueRef.current.userProperties['role'] = get(link, 'role.name')
                trackingProviderValueRef.current.userProperties['organization'] = get(link, 'organization.name')
            }
        }
    }, [user, link])

    // Page path changed -> change value at context object
    useEffect(() => {
        trackingProviderValueRef.current.eventProperties['page']['path'] = asPath
    }, [asPath])

    return (
        <TrackingContext.Provider value={trackingProviderValueRef.current}>
            {children}
        </TrackingContext.Provider>
    )
}

export enum TrackingPageState {
    Empty = 'Empty',
    InProgress = 'InProgress',
    Error = 'Error',
    Success = 'Success',
    AccessError = 'AccessError',
}

interface TrackingComponentLoadEvent {
    eventType: string
    pageState?: TrackingPageState
    extraEventProperties?: Record<string, number | string>
}

const TrackingComponentLoadEvent: React.FC<TrackingComponentLoadEvent> = (props) => {
    const { children, eventType, pageState = TrackingPageState.Success, extraEventProperties = {} } = props
    const { eventProperties, logEvent } = useTracking()

    const pageProps = get(eventProperties, 'page', {}) as Record<string, unknown>
    useEffect(() => {
        logEvent({ eventName: eventType, eventProperties: {
            page: {
                ...pageProps,
                state: pageState,
            },
            ...extraEventProperties,
        } })
    }, [])

    return (
        <>
            {children}
        </>
    )
}

export { useTracking, TrackingProvider, TrackingComponentLoadEvent }

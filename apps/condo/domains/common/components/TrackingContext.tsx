import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import pick from 'lodash/pick'
import compact from 'lodash/compact'
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

type TrackingCommonEventProperties = Record<string, unknown>

export interface ITrackingComponent {
    eventName?: string
    eventProperties?: TrackingCommonEventProperties
}

interface ITrackingContext {
    trackerInstances: Record<string, TrackerInstance>
    eventProperties?: TrackingEventPropertiesType
    userProperties?: TrackingCommonEventProperties
    setUserProperties? (newProps: TrackingCommonEventProperties): void
    setEventProperties? (newProps: TrackingCommonEventProperties): void
}

interface ILogEventTo extends ITrackerLogEventType {
    destination: Array<string>
}

const TrackingContext = createContext<ITrackingContext>(TRACKING_INITIAL_VALUE)

const useTrackingContext = (): ITrackingContext => useContext<ITrackingContext>(TrackingContext)

export enum TrackingEventType {
    Visit = 'Visit',
    Click = 'Click',
    Input = 'Input',
    Select = 'Select',
}

interface IUseTracking {
    (): {
        eventProperties: ITrackingContext['eventProperties']
        userProperties: Pick<ITrackingContext, 'userProperties'>
        logEvent: (logEventProps: ITrackerLogEventType) => void
        logEventTo: (logEventToProps: ILogEventTo) => void
        setEventProperties: (newProps: TrackingCommonEventProperties) => void
        setUserProperties: (newProps: TrackingCommonEventProperties) => void
        instrument: (eventName: string, func?: any) => any
        getEventName: (eventType: TrackingEventType) => string
    }
}

const useTracking: IUseTracking = () => {
    const { route } = useRouter()
    const { trackerInstances, eventProperties, userProperties, setUserProperties, setEventProperties } = useTrackingContext()

    const logEvent = ({ eventName, eventProperties: localEventProperties = {} }: ITrackerLogEventType) => {
        const resultEventProperties = {
            ...eventProperties,
            ...localEventProperties,
        }
        Object.values(trackerInstances).map(trackerInstance => trackerInstance.logEvent({
            eventName,
            eventProperties: resultEventProperties,
        }))
    }

    const logEventTo = ({ eventName, eventProperties: localEventProperties = {}, destination }: ILogEventTo) => {
        const resultEventProperties = {
            ...eventProperties,
            ...localEventProperties,
        }
        Object.values(pick(trackerInstances, destination)).map(trackerInstance => trackerInstance.logEvent({
            eventName,
            eventProperties: resultEventProperties,
        }))
    }

    const instrument = (eventName: string, func?: any) => {
        function fn (...params: any) {
            const retVal = func ? func(...params) : undefined
            logEvent({ eventName, eventProperties })
            return retVal
        }
        return fn as any
    }

    const getEventName = (eventType: TrackingEventType) => {
        const [domainName, isDetail, suffix] = compact(route.split('/'))
        const domain = domainName.charAt(0).toUpperCase() + domainName.slice(1)
        let domainSuffix = 'Index'
        let domainPostfix = ''

        switch (isDetail) {
            case '[id]':
                domainSuffix = 'Detail'
                break
            case 'create':
                domainSuffix = 'Create'
                break
            default:
                break
        }

        if (suffix) {
            switch (suffix) {
                case 'update':
                    domainPostfix = 'Update'
                    break
                case 'pdf':
                    domainPostfix = 'Pdf'
                    break
                default:
                    // convert string from domain-related-page to DomainRelatedPage
                    domainPostfix = suffix.replace(/(-\w|^\w)/g, (_, g) => g.slice(-1).toUpperCase())
                    break
            }
        }

        return `${domain}${eventType}${domainSuffix}${domainPostfix}`
    }

    return {
        eventProperties,
        userProperties,
        logEvent,
        logEventTo,
        setEventProperties,
        setUserProperties,
        instrument,
        getEventName,
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
        setUserProperties (newProps: TrackingCommonEventProperties) {
            this.userProperties = Object.assign(this.userProperties, newProps)
        },
        setEventProperties (newProps: TrackingCommonEventProperties) {
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
        <TrackingContext.Provider value={{ ...trackingProviderValueRef.current }}>
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
    const pageProps = get(eventProperties, 'page', {}) as TrackingCommonEventProperties
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

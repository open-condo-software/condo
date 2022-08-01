import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import pick from 'lodash/pick'
import compact from 'lodash/compact'
import isUndefined from 'lodash/isUndefined'
import isFunction from 'lodash/isFunction'
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
    Checkbox = 'Checkbox',
    Radio = 'Radio',
    FollowExternalLink = 'FollowExternalLink',
    ImportComplete = 'ImportComplete',
}

interface IUseTracking {
    (): {
        eventProperties: ITrackingContext['eventProperties']
        userProperties: Pick<ITrackingContext, 'userProperties'>
        logEvent: (logEventProps: ITrackerLogEventType) => void
        logEventTo: (logEventToProps: ILogEventTo) => void
        getTrackingWrappedCallback: (eventName: string, eventProperties?: TrackingCommonEventProperties, func?: any) => any
        getEventName: (eventType: TrackingEventType) => string
    }
}

const useTracking: IUseTracking = () => {
    const router = useRouter()
    const route = get(router, 'route', '')
    const { trackerInstances, eventProperties, userProperties } = useTrackingContext()

    const logEvent = useCallback(({ eventName, eventProperties: localEventProperties = {}, denyDuplicates }: ITrackerLogEventType) => {
        const resultEventProperties = {
            ...eventProperties,
            ...localEventProperties,
        }
        Object.values(trackerInstances).forEach((trackerInstance) => trackerInstance.logEvent({
            eventName,
            eventProperties: resultEventProperties,
            denyDuplicates,
            userProperties,
        }))
    }, [eventProperties, trackerInstances, userProperties])

    const logEventTo = useCallback(({ eventName, eventProperties: localEventProperties = {}, destination, denyDuplicates }: ILogEventTo) => {
        const resultEventProperties = {
            ...eventProperties,
            ...localEventProperties,
        }
        Object.values(pick(trackerInstances, destination)).forEach(trackerInstance => trackerInstance.logEvent({
            eventName,
            eventProperties: resultEventProperties,
            denyDuplicates,
            userProperties,
        }))
    }, [eventProperties, trackerInstances, userProperties])

    const getTrackingWrappedCallback = <T extends (...args: any[]) => any>(eventName: string, eventProperties?: TrackingEventPropertiesType, func?: T): T => {
        function fn (...params) {
            const retVal = isFunction(func) ? func(...params) : undefined
            logEvent({ eventName, eventProperties, userProperties })
            return retVal
        }
        return fn as T
    }

    const getEventName = (eventType: TrackingEventType) => {
        const [domainName, isDetail, suffix] = compact(route.split('/'))
        if (!domainName) {
            return ''
        }
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
        getTrackingWrappedCallback,
        getEventName,
    }
}

const TrackingProvider: React.FC = ({ children }) => {
    const { user } = useAuth()
    const { link } = useOrganization()
    const router = useRouter()

    const trackingProviderValueRef = useRef<ITrackingContext>({
        trackerInstances: TRACKING_INITIAL_VALUE.trackerInstances,
        userProperties: {},
        eventProperties: {
            page: {
                path: router.asPath,
            },
        },
    })

    const routeChangeComplete = (url) => {
        trackingProviderValueRef.current.eventProperties.page.path = url
    }

    useEffect(() => {
        // Init all instances of trackers only on client side rendering
        if (!isUndefined(window)) {
            // Page path changed -> change value at context object
            router.events.on('routeChangeComplete', routeChangeComplete)
            Object.values(trackingProviderValueRef.current.trackerInstances).forEach(trackerInstance => trackerInstance.init())
        }

        return () => {
            router.events.off('routeChangeComplete', routeChangeComplete)
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

export { useTracking, TrackingProvider }

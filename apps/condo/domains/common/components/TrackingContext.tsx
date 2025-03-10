import compact from 'lodash/compact'
import isFunction from 'lodash/isFunction'
import isUndefined from 'lodash/isUndefined'
import upperFirst from 'lodash/upperFirst'
import { useRouter } from 'next/router'
import React, { createContext, useContext, useLayoutEffect, useRef, useCallback } from 'react'

type ITrackerLogEventType = {
    eventName: string
    eventProperties?: Record<string, unknown>
    denyDuplicates?: boolean
}

const TRACKING_INITIAL_VALUE = {
    // Here you should create app related tracker instances
    // trackerInstances: { amplitude: new AmplitudeInstance() },
    trackerInstances: {},
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
    trackerInstances: Record<string, any>
    eventProperties?: TrackingEventPropertiesType
}

const TrackingContext = createContext<ITrackingContext>(TRACKING_INITIAL_VALUE)

const useTrackingContext = (): ITrackingContext => useContext<ITrackingContext>(TrackingContext)

const DETAIL_PAGE_NAMES = ['create', 'update', 'hint', 'detail', 'forgot', 'signin', 'register', 'change-password']

export enum TrackingEventType {
    Visit = 'Visit',
    Click = 'Click',
    Input = 'Input',
    Select = 'Select',
    Checkbox = 'Checkbox',
    Radio = 'Radio',
    Daterange = 'Daterange',
    FollowExternalLink = 'FollowExternalLink',
    ImportComplete = 'ImportComplete',
    OnBoardingStepsCompleted = 'OnBoardingStepsCompleted',
    FileUpload = 'FileUpload',
}

const getEventNameFromRoute = (route: string, eventType: TrackingEventType): string => {
    const [domainName, detailPageName, suffix, customPage] = compact(route.split('/'))
    if (!domainName) {
        return ''
    }
    const domain = upperFirst(domainName)
    let domainSuffix = 'Index'
    let domainPostfix = ''

    if (detailPageName === '[id]') {
        domainSuffix = 'Detail'
    } else if (DETAIL_PAGE_NAMES.includes(detailPageName)) {
        domainSuffix = upperFirst(detailPageName)
    }

    const postfixToken = customPage ? customPage : suffix

    if (postfixToken) {
        switch (postfixToken) {
            case 'update':
                domainPostfix = 'Update'
                break
            case 'pdf':
                domainPostfix = 'Pdf'
                break
            case '[id]':
                domainSuffix = 'Detail'
                break
            default:
                // convert string from domain-related-page to DomainRelatedPage
                domainPostfix = postfixToken.replace(/(-\w|^\w)/g, (_, g) => g.slice(-1).toUpperCase())
                break
        }
    }

    return `${domain}${eventType}${domainSuffix}${domainPostfix}`
}

interface IGetEventName {
    (eventType: TrackingEventType): string
}

interface IUseTracking {
    (): {
        eventProperties: ITrackingContext['eventProperties']
        logEvent: (logEventProps: ITrackerLogEventType) => void
        getTrackingWrappedCallback: (eventName: string, eventProperties?: TrackingCommonEventProperties, func?: any) => any
        getEventName: IGetEventName
    }
}

const useTracking: IUseTracking = () => {
    const { trackerInstances, eventProperties } = useTrackingContext()
    const { route } = useRouter()

    const logEvent = useCallback(({ eventName, eventProperties: localEventProperties = {}, denyDuplicates }: ITrackerLogEventType) => {
        const resultEventProperties = {
            ...eventProperties,
            ...localEventProperties,
        }
        Object.values(trackerInstances).forEach((trackerInstance) => trackerInstance.logEvent({
            eventName,
            eventProperties: resultEventProperties,
            denyDuplicates,
        }))
    }, [eventProperties, trackerInstances])

    const getTrackingWrappedCallback = <T extends (...args: any[]) => any>(eventName: string, eventProperties?: TrackingEventPropertiesType, func?: T): T => {
        function fn (...params) {
            const retVal = isFunction(func) ? func(...params) : undefined
            logEvent({ eventName, eventProperties })
            return retVal
        }
        return fn as T
    }

    const getEventName: IGetEventName = (eventType) => {
        return getEventNameFromRoute(route, eventType)
    }

    return {
        eventProperties,
        logEvent,
        getTrackingWrappedCallback,
        getEventName,
    }
}

const TrackingProvider: React.FC = ({ children }) => {
    const router = useRouter()

    const trackingProviderValueRef = useRef<ITrackingContext>({
        trackerInstances: TRACKING_INITIAL_VALUE.trackerInstances,
        eventProperties: {
            page: {
                path: router.asPath,
            },
        },
    })

    // It's important to init all the analytics instances right before first content render
    useLayoutEffect(() => {
        if (!isUndefined(window)) {
            Object.values(trackingProviderValueRef.current.trackerInstances)
                .forEach(trackerInstance => trackerInstance.init())
        }
    }, [])

    return (
        <TrackingContext.Provider value={trackingProviderValueRef.current}>
            {children}
        </TrackingContext.Provider>
    )
}

export { useTracking, TrackingProvider }

import compact from 'lodash/compact'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import isUndefined from 'lodash/isUndefined'
import pick from 'lodash/pick'
import upperFirst from 'lodash/upperFirst'
import { useRouter } from 'next/router'
import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useCallback } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { TRACKING_USER_FIELDS } from '@condo/domains/user/constants'

import { usePostMessageContext } from './PostMessageProvider'
import AmplitudeInstance from './trackers/AmplitudeInstance'
import TrackerInstance, { ITrackerLogEventType } from './trackers/TrackerInstance'

import type { RequestHandler } from './PostMessageProvider/types'

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
        userProperties: Pick<ITrackingContext, 'userProperties'>
        logEvent: (logEventProps: ITrackerLogEventType) => void
        logEventTo: (logEventToProps: ILogEventTo) => void
        getTrackingWrappedCallback: (eventName: string, eventProperties?: TrackingCommonEventProperties, func?: any) => any
        getEventName: IGetEventName
    }
}

const useTracking: IUseTracking = () => {
    const { trackerInstances, eventProperties, userProperties } = useTrackingContext()
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

    const getEventName: IGetEventName = (eventType) => {
        return getEventNameFromRoute(route, eventType)
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
    const { addEventHandler } = usePostMessageContext()

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

    const handleExternalAnalyticsEvent = useCallback<RequestHandler<'CondoWebSendAnalyticsEvent'>>((params) => {
        const eventName = getEventNameFromRoute(router.route, upperFirst(params.event) as TrackingEventType)
        const eventProperties = {
            ...trackingProviderValueRef.current.eventProperties,
            components: params,
        }
        Object.values(trackingProviderValueRef.current.trackerInstances).forEach((trackerInstance) => trackerInstance.logEvent({
            eventName,
            eventProperties,
            userProperties: trackingProviderValueRef.current.userProperties,
        }))

        return { sent: true }
    }, [router.route])

    // It's important to init all the analytics instances right before first content render
    useLayoutEffect(() => {
        if (!isUndefined(window)) {
            Object.values(trackingProviderValueRef.current.trackerInstances)
                .forEach(trackerInstance => trackerInstance.init())
        }
    }, [])

    useEffect(() => {
        // Init all instances of trackers only on client side rendering
        if (!isUndefined(window)) {
            addEventHandler('CondoWebSendAnalyticsEvent', '*', handleExternalAnalyticsEvent)
            // Page path changed -> change value at context object
            router.events.on('routeChangeComplete', routeChangeComplete)
        }

        return () => {
            router.events.off('routeChangeComplete', routeChangeComplete)
        }
    }, [router, addEventHandler, handleExternalAnalyticsEvent])

    // Collect user & organization related data to slice custom groups based on given attributes
    useEffect(() => {
        if (user) {
            trackingProviderValueRef.current.userProperties = pick(user, TRACKING_USER_FIELDS)

            if (link) {
                trackingProviderValueRef.current.userProperties['role'] = get(link, 'role.name')
                trackingProviderValueRef.current.userProperties['organization'] = get(link, 'organization.name')
                trackingProviderValueRef.current.userProperties['organizationId'] = get(link, 'organization.id')
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

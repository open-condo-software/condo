import React, { useEffect } from 'react'
import get from 'lodash/get'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { AmplitudeEventType } from '@condo/domains/common/components/containers/amplitude/AmplitudeProvider'
// import { AuthorizedUserEventProperties } from 'domains/common/components/containers/amplitude/TrackingAuthorizedUser'

export enum AmplitudePageState {
    Empty = 'Empty',
    InProgress = 'InProgress',
    Error = 'Error',
    Success = 'Success',
    AccessError = 'AccessError',
}

interface IAmplitudeLogOnMountEvent {
    eventType: AmplitudeEventType
    pageState?: AmplitudePageState
    extraEventProperties?: Record<string, number | string>
}

const TrackPageLoadEvent: React.FC<IAmplitudeLogOnMountEvent> = (props) => {
    const { children, eventType, pageState = AmplitudePageState.Success, extraEventProperties = {} } = props
    const { eventProperties, logEvent, trackerInstances } = useTracking()
    // const { logEvent, eventProperties } = useAmplitude()
    // eventProperties={(baseEventProperties: AuthorizedUserEventProperties) => ({
    //     ...baseEventProperties,
    //     page: {
    //         ...baseEventProperties.page,
    //         state: pageState,
    //     },
    //     ...extraEventProperties,
    // })}

    const pageProps = get(eventProperties, 'page', {}) as Record<string, unknown>
    useEffect(() => {
        console.log('tracker instances on page ready to log')
        console.log(trackerInstances.amplitude)
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

export { TrackPageLoadEvent }

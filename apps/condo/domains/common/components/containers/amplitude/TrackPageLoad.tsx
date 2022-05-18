import React, { useEffect } from 'react'
import get from 'lodash/get'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { AmplitudeEventType } from '@condo/domains/common/components/containers/amplitude/AmplitudeProvider'

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

export { TrackPageLoadEvent }

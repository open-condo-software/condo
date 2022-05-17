import React, { useEffect } from 'react'
import get from 'lodash/get'
import { useAmplitude } from '@condo/domains/common/utils/amplitudeUtils'
import { AmplitudeEventType } from '@condo/domains/common/components/containers/amplitude/AmplitudeProvider'
import { AuthorizedUserEventProperties } from '@condo/domains/common/components/containers/amplitude/AmplitudeAuthorizedUser'

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
    const { logEvent, eventProperties } = useAmplitude()
    // eventProperties={(baseEventProperties: AuthorizedUserEventProperties) => ({
    //     ...baseEventProperties,
    //     page: {
    //         ...baseEventProperties.page,
    //         state: pageState,
    //     },
    //     ...extraEventProperties,
    // })}

    const pageProps = get(eventProperties, 'page', {})
    useEffect(() => {
        // FIXME: replace with global logEvent (not amplitude hook)
        logEvent(eventType, {
            page: {
                ...pageProps,
                state: pageState,
            },
            ...extraEventProperties,
        })
    }, [])

    return (
        <>
            {children}
        </>
    )
}

export { TrackPageLoadEvent }

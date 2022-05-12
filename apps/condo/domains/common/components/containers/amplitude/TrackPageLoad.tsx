import React from 'react'
import { LogOnMount } from 'react-amplitude-hooks'
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

    return (
        <>
            <LogOnMount
                eventType={eventType}
                eventProperties={(baseEventProperties: AuthorizedUserEventProperties) => ({
                    ...baseEventProperties,
                    page: {
                        ...baseEventProperties.page,
                        state: pageState,
                    },
                    ...extraEventProperties,
                })}
            />
            {children}
        </>
    )
}

export { TrackPageLoadEvent }

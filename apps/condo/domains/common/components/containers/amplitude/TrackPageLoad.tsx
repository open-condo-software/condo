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
    pageState: AmplitudePageState
}

const TrackPageLoadEvent: React.FC<IAmplitudeLogOnMountEvent> = ({ children, pageState }) => (
    <>
        <LogOnMount
            eventType={AmplitudeEventType.pageLoad}
            eventProperties={(baseEventProperties: AuthorizedUserEventProperties) => ({
                ...baseEventProperties,
                page: {
                    ...baseEventProperties.page,
                    state: pageState,
                },
            })}
        />
        {children}
    </>
)

export { TrackPageLoadEvent }

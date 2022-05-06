import React from 'react'
import { LogOnMount } from 'react-amplitude-hooks'
import { AmplitudeEventType } from '@condo/domains/common/components/containers/amplitude/AmplitudeProvider'
import { AuthorizedUserEventProperties } from '@condo/domains/common/components/containers/amplitude/AmplitudeAuthorizedUser'

export enum AmplitudeBillingEvent {
    Empty = 'Empty',
    InProgress = 'InProgress',
    Error = 'Error',
    Success = 'Success',
    AccessError = 'AccessError',
}

interface IBillingAmplitudeLogOnMountEvent {
    pageState: AmplitudeBillingEvent
}

const TrackPageLoadEvent: React.FC<IBillingAmplitudeLogOnMountEvent> = ({ children, pageState }) => (
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

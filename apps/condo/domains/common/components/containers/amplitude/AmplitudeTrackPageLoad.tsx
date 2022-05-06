import React from 'react'
import { Amplitude, LogOnMount } from 'react-amplitude-hooks'
import { useRouter } from 'next/router'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import omit from 'lodash/omit'
import { BaseEventProperties, AmplitudeEventType } from '@condo/domains/common/components/containers/amplitude/AmplitudeProvider'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

const USER_OMITTED_FIELDS = ['phone', 'email', '__typename', 'avatar']

export type AmplitudeUserProperties = Partial<BaseEventProperties['user']> & {
    organization?: string
    role?: string
}

const AmplitudeTrackPageLoad: React.FC = ({ children }) => {
    const { pathname } = useRouter()
    const { user } = useAuth()
    const { organization } = useOrganization()

    let userProperties: AmplitudeUserProperties = {}
    let organizationEmployeeWhere = {}

    if (user && organization) {
        organizationEmployeeWhere = {
            user: {
                id: user.id,
            },
            organization: {
                id: organization.id,
            },
            isAccepted: true,
        }
    }

    const { obj: userOrganization } = OrganizationEmployee.useObject(
        { where: organizationEmployeeWhere },
        { fetchPolicy: 'cache-first' }
    )

    if (user) {
        userProperties = omit(user, USER_OMITTED_FIELDS)

        if (userOrganization) {
            userProperties.role = userOrganization.role.name
            userProperties.organization = userOrganization.organization.name
        }
    }

    return (
        <Amplitude
            eventProperties={(inheritProps: BaseEventProperties) => ({
                page: {
                    pathname,
                },
                user: {
                    ...inheritProps.user,
                    ...userProperties,
                },
            })}
            debounceInterval={200}
        >
            <LogOnMount eventType={AmplitudeEventType.pageLoad} />
            {children}
        </Amplitude>
    )
}

export default AmplitudeTrackPageLoad

import React from 'react'
import { Amplitude } from '@condo/domains/common/utils/amplitudeUtils'
import { useAuth } from '@core/next/auth'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import omit from 'lodash/omit'
import { BaseEventProperties } from '@condo/domains/common/components/containers/amplitude/AmplitudeProvider'

const USER_OMITTED_FIELDS = ['phone', 'email', '__typename', 'avatar', 'isAdmin']

export type AmplitudeUserProperties = Partial<BaseEventProperties['user']> & {
    organization?: string
    role?: string
}

export type AuthorizedUserEventProperties = Pick<BaseEventProperties, 'page'> & AmplitudeUserProperties

const AmplitudeAuthorizedUser: React.FC = ({ children }) => {
    const { user } = useAuth()
    const { link } = useOrganization()

    let userProperties: AmplitudeUserProperties = {}

    if (user) {
        userProperties = omit(user, USER_OMITTED_FIELDS)

        if (link) {
            userProperties.role = get(link, 'role.name')
            userProperties.organization = get(link, 'organization.name')
        }
    }

    return (
        <Amplitude
            userProperties={userProperties}
        >
            {children}
        </Amplitude>
    )
}

export default AmplitudeAuthorizedUser

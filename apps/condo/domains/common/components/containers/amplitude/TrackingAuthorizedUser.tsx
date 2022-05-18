import React from 'react'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
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

const TrackingAuthorizedUser: React.FC = ({ children }) => {
    const { user } = useAuth()
    const { link } = useOrganization()
    const { setUserProperties } = useTracking()

    let newUserProperties: AmplitudeUserProperties = {}

    if (user) {
        newUserProperties = omit(user, USER_OMITTED_FIELDS)

        if (link) {
            newUserProperties.role = get(link, 'role.name')
            newUserProperties.organization = get(link, 'organization.name')
        }
        setUserProperties(newUserProperties)
    }

    return children as React.ReactElement
}

export default TrackingAuthorizedUser

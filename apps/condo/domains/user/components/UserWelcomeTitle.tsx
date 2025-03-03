import { setCookie } from 'cookies-next'
import Link from 'next/link'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { COOKIE_MAX_AGE_IN_SEC } from '@condo/domains/common/constants/cookies'
import { AUTH_FLOW_USER_TYPE_COOKIE_NAME } from '@condo/domains/user/constants/auth'


type WelcomeHeaderTitleProps = {
    userType: 'staff' | 'resident'
}

export const WelcomeHeaderTitle: React.FC<WelcomeHeaderTitleProps> = ({ userType }) => {
    const intl = useIntl()
    const IAmResidentMessage = intl.formatMessage({ id: 'pages.auth.IAmResident' })
    const IAmOrganizationRepresentativeMessage = intl.formatMessage({ id: 'pages.auth.IAmOrganizationRepresentative' })

    return (
        <Link href={userType === 'resident' ? '/auth/register' : '/auth/resident'}>
            <Typography.Link onClick={() => setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, userType === 'resident' ? 'staff' : 'resident', { maxAge: COOKIE_MAX_AGE_IN_SEC })}>
                {userType === 'resident' ? IAmOrganizationRepresentativeMessage : IAmResidentMessage}
            </Typography.Link>
        </Link>
    )
}

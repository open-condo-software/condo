import getConfig from 'next/config'
import Link from 'next/link'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'


const {
    publicRuntimeConfig: {
        residentAppInfo,
    },
} = getConfig()

type WelcomeHeaderTitleProps = {
    userType: 'staff' | 'resident'
}

export const WelcomeHeaderTitle: React.FC<WelcomeHeaderTitleProps> = ({ userType }) => {
    const intl = useIntl()
    const IAmResidentMessage = intl.formatMessage({ id: 'pages.auth.IAmResident' })
    const IAmOrganizationRepresentativeMessage = intl.formatMessage({ id: 'pages.auth.IAmOrganizationRepresentative' })

    if (!residentAppInfo?.mobile?.help || !residentAppInfo?.mobile?.download) {
        return null
    }

    return (
        <Link href={userType === 'resident' ? '/auth/signin' : '/auth/resident'} legacyBehavior>
            <Typography.Link>
                {userType === 'resident' ? IAmOrganizationRepresentativeMessage : IAmResidentMessage}
            </Typography.Link>
        </Link>
    )
}

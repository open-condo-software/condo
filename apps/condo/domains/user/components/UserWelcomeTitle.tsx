import Link from 'next/link'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'


type WelcomeHeaderTitleProps = {
    userType: 'staff' | 'resident'
}

export const WelcomeHeaderTitle: React.FC<WelcomeHeaderTitleProps> = ({ userType }) => {
    const intl = useIntl()
    const IAmResidentMessage = intl.formatMessage({ id: 'pages.auth.IAmResident' })
    const IAmOrganizationRepresentativeMessage = intl.formatMessage({ id: 'pages.auth.IAmOrganizationRepresentative' })

    return (
        <Link href={userType === 'resident' ? '/auth/signin' : '/auth/resident'}>
            <Typography.Link>
                {userType === 'resident' ? IAmOrganizationRepresentativeMessage : IAmResidentMessage}
            </Typography.Link>
        </Link>
    )
}

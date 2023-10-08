import { useRouter } from 'next/router'
import React from 'react'

import { AccessDeniedPage } from '@condo/domains/common/components/containers/AccessDeniedPage'

export const OnlyTicketPagesAccess = ({ children }) => {
    const router = useRouter()

    if (router.route && !router.route.includes('ticket')) {
        return (
            <AccessDeniedPage />
        )
    }

    return (
        <>
            {children}
        </>
    )
}

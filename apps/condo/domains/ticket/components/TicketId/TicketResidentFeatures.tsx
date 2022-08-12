import { Ticket } from '@app/condo/schema'
import { MobileIcon } from '@condo/domains/common/components/icons/MobileIcon'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import get from 'lodash/get'
import React from 'react'
import { useIntl } from '@condo/next/intl'

interface TicketResidentFeaturesProps {
    ticket: Ticket
}

export const TicketResidentFeatures: React.FC<TicketResidentFeaturesProps> = ({ ticket }) => {
    const intl = useIntl()
    const MobileAppInstalledMessage = intl.formatMessage({ id: 'pages.condo.ticket.MobileAppInstalled' })
    const MobileAppNotInstalledMessage = intl.formatMessage({ id: 'pages.condo.ticket.MobileAppNotInstalled' })

    const isContactHasMobileApp = !!get(ticket, 'client')

    return (
        <Tooltip title={isContactHasMobileApp ? MobileAppInstalledMessage : MobileAppNotInstalledMessage}>
            <MobileIcon active={isContactHasMobileApp} />
        </Tooltip>
    )
}
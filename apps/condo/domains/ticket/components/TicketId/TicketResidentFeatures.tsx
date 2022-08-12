import { Ticket } from '@app/condo/schema'

import { MobileIcon } from '@condo/domains/common/components/icons/MobileIcon'
import get from 'lodash/get'
import React from 'react'

interface TicketResidentFeaturesProps {
    ticket: Ticket
}

export const TicketResidentFeatures: React.FC<TicketResidentFeaturesProps> = ({ ticket }) => {
    const isContactHasMobileApp = !!get(ticket, 'client')

    return (
        <MobileIcon active={isContactHasMobileApp} />
    )
}
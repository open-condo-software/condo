import React from 'react'
import get from 'lodash/get'
import { Ticket } from '@app/condo/schema'

import { MobileIcon } from '@condo/domains/common/components/icons/MobileIcon'

type TicketResidentFeaturesProps = {
    ticket: Ticket
}

export const TicketResidentFeatures: React.FC<TicketResidentFeaturesProps> = ({ ticket }) => {
    const ticketClient = get(ticket, 'client')

    return (
        <MobileIcon active={ticketClient} />
    )
}
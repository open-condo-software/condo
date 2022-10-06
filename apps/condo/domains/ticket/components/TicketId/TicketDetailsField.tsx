import React from 'react'
import { useIntl } from '@condo/next/intl'

import { Ticket } from '@app/condo/schema'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

type TicketDetailsFieldProps = {
    ticket: Ticket
}

export const TicketDetailsField: React.FC<TicketDetailsFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const TicketDetailsMessage = intl.formatMessage({ id: 'Problem' })

    return (
        <PageFieldRow title={TicketDetailsMessage} ellipsis lineWrapping='break-spaces'>
            {ticket.details}
        </PageFieldRow>
    )
}
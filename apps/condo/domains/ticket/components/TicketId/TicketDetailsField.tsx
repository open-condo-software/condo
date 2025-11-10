import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Markdown } from '@open-condo/ui'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

type TicketDetailsFieldProps = {
    ticketDetails: string
    updateTicketDetails?: (newTicketDetails: string) => void
}

export const TicketDetailsField: React.FC<TicketDetailsFieldProps> = ({ ticketDetails, updateTicketDetails }) => {
    const intl = useIntl()
    const TicketDetailsMessage = intl.formatMessage({ id: 'Problem' })

    return (
        <>
            <PageFieldRow title={TicketDetailsMessage} ellipsis>
                <Markdown type='inline' onCheckboxChange={updateTicketDetails}>
                    {ticketDetails}
                </Markdown>
            </PageFieldRow>
        </>
    )
}
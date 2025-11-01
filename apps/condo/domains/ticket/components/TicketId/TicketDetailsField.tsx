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

    // This is for backwards compatibility
    const getUpdateTicketDetailsFunction = () => {
        if (typeof updateTicketDetails === 'function') {
            return (newDetails) => updateTicketDetails(newDetails)
        } else {
            return () => {}
        }
    }

    return (
        <>
            <PageFieldRow title={TicketDetailsMessage} ellipsis>
                <Markdown type='lite' onCheckboxChange = {getUpdateTicketDetailsFunction()}>
                    {ticketDetails}
                </Markdown>
            </PageFieldRow>
        </>
    )
}
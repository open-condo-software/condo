import { Ticket, TicketStatusTypeType } from '@app/condo/schema'
import { Typography } from 'antd'
import dayjs from 'dayjs'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

type TicketDeferredDateFieldProps = {
    ticket: Ticket
}

export const TicketDeferredDateField: React.FC<TicketDeferredDateFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const DeferredDateMessage = intl.formatMessage({ id: 'ticket.id.ticketDefer.deferredDate.field' })

    const ticketDeferredDate = ticket.deferredUntil ? dayjs(ticket.deferredUntil).format('DD MMMM YYYY') : null
    const isDeferredTicket = ticket.status.type === TicketStatusTypeType.Deferred

    return isDeferredTicket && ticketDeferredDate ? (
        <PageFieldRow title={DeferredDateMessage} ellipsis={{ rows: 2 }}>
            <Typography.Text strong>{ticketDeferredDate}</Typography.Text>
        </PageFieldRow>
    ) : null
}
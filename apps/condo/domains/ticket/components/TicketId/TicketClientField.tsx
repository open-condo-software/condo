import { Typography } from 'antd'
import { get } from 'lodash'
import Link from 'next/link'
import { useIntl } from '@core/next/intl'
import React, { useMemo } from 'react'
import { Ticket } from '@app/condo/schema'
import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { TICKET_CARD_LINK_STYLE } from '@condo/domains/ticket/constants/style'
import { TicketUserInfoField } from './TicketUserInfoField'

type TicketClientFieldProps = {
    ticket: Ticket
}

export const TicketClientField: React.FC<TicketClientFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const ResidentClientMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.ResidentClient' })
    const NotResidentClientMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.NotResidentClient' })

    const contactId = get(ticket, ['contact', 'id'])
    const ClientMessage = useMemo(() => contactId ? ResidentClientMessage : NotResidentClientMessage,
        [NotResidentClientMessage, ResidentClientMessage, contactId])

    const contactUser = useMemo(() => ({
        name: get(ticket, ['contact', 'name']),
        phone: get(ticket, ['contact', 'phone']),
    }), [ticket])

    const clientUser = useMemo(() => ({
        name: get(ticket, 'clientName'),
        phone: get(ticket, 'clientPhone'),
    }), [ticket])

    return (
        <PageFieldRow title={ClientMessage} highlight>
            {
                contactId
                    ? <Link href={`/contact/${contactId}`}>
                        <Typography.Link style={TICKET_CARD_LINK_STYLE}>
                            <TicketUserInfoField
                                user={contactUser}
                            />
                        </Typography.Link>
                    </Link>
                    : <Typography.Text>
                        <TicketUserInfoField
                            user={clientUser}
                        />
                    </Typography.Text>
            }
        </PageFieldRow>
    )
}
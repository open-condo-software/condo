import { Ticket } from '@app/condo/schema'
import { Typography } from 'antd'
import { get } from 'lodash'
import Link from 'next/link'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { TICKET_CARD_LINK_STYLE } from '@condo/domains/ticket/constants/style'

import { TicketUserInfoField } from './TicketUserInfoField'

type TicketClientFieldProps = {
    ticket: Ticket
}

const ELLIPSIS_CONFIG = { rows: 2 }

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
        <PageFieldRow title={ClientMessage} ellipsis={ELLIPSIS_CONFIG}>
            {
                contactId
                    ? <TicketUserInfoField
                        user={contactUser}
                        nameLink={`/contact/${contactId}`}
                        ticket={ticket}
                    />
                    : <Typography.Text>
                        <TicketUserInfoField
                            user={clientUser}
                        />
                    </Typography.Text>
            }
        </PageFieldRow>
    )
}
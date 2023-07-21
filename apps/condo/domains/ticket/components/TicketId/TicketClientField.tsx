import { Ticket } from '@app/condo/schema'
import { Typography } from 'antd'
import { get } from 'lodash'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

import { TicketUserInfoField } from './TicketUserInfoField'

type TicketClientFieldProps = {
    ticket: Ticket
    phonePrefix?: string
}

const ELLIPSIS_CONFIG = { rows: 2 }

export const TicketClientField: React.FC<TicketClientFieldProps> = ({ ticket, phonePrefix }) => {
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
                        phonePrefix={phonePrefix}
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
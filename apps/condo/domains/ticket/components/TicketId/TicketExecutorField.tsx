import React, { useMemo } from 'react'
import { Typography } from 'antd'
import { get } from 'lodash'
import Link from 'next/link'

import { useIntl } from '@core/next/intl'
import { Ticket } from '@app/condo/schema'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { TICKET_CARD_LINK_STYLE } from '@condo/domains/ticket/constants/style'
import { TicketUserInfoField } from './TicketUserInfoField'

type TicketExecutorFieldProps = {
    ticket: Ticket
}

export const TicketExecutorField: React.FC<TicketExecutorFieldProps> = ({ ticket }) => {
    const intl = useIntl()
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const EmployeeIsNullOrWasDeletedMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.EmployeeIsNullOrWasDeleted' })

    const ticketExecutorUserId = useMemo(() => get(ticket, ['executor', 'id'], null), [ticket])
    const ticketOrganizationId = useMemo(() => get(ticket, ['organization', 'id'], null), [ticket])

    const { obj: executor } = OrganizationEmployee.useObject({
        where: {
            organization: {
                id: ticketOrganizationId,
            },
            user: {
                id: ticketExecutorUserId,
            },
        },
    })

    const executorUser = useMemo(() => ({
        name: get(executor, 'name'),
        phone: get(executor, 'phone'),
        email: get(executor, 'email'),
    }), [executor])

    return (
        <PageFieldRow title={ExecutorMessage}>
            {
                executor
                    ? <Link href={`/employee/${get(executor, 'id')}`}>
                        <Typography.Link style={TICKET_CARD_LINK_STYLE}>
                            <Typography.Text strong>
                                <TicketUserInfoField user={executorUser} />
                            </Typography.Text>
                        </Typography.Link>
                    </Link>
                    : <Typography.Text type='secondary'>
                        {EmployeeIsNullOrWasDeletedMessage}
                    </Typography.Text>
            }
        </PageFieldRow>
    )
}
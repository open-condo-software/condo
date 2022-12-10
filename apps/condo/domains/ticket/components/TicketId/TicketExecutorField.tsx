import { Ticket } from '@app/condo/schema'
import { Typography } from 'antd'
import { get } from 'lodash'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

import { TicketUserInfoField } from './TicketUserInfoField'

type TicketExecutorFieldProps = {
    ticket: Ticket
    phonePrefix?: string
}

export const TicketExecutorField: React.FC<TicketExecutorFieldProps> = ({ ticket, phonePrefix }) => {
    const intl = useIntl()
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const EmployeeIsNullOrWasDeletedMessage = intl.formatMessage({ id: 'ticket.field.EmployeeIsNullOrWasDeleted' })

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
        <PageFieldRow title={ExecutorMessage} ellipsis>
            {
                executor
                    ? <Typography.Text strong>
                        <TicketUserInfoField
                            user={executorUser}
                            nameLink={`/employee/${get(executor, 'id')}`}
                            phonePrefix={phonePrefix}
                        />
                    </Typography.Text>
                    : <Typography.Text type='secondary'>
                        {EmployeeIsNullOrWasDeletedMessage}
                    </Typography.Text>
            }
        </PageFieldRow>
    )
}
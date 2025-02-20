import { useGetOrganizationEmployeeByUserAndOrganizationIdsQuery } from '@app/condo/gql'
import { Ticket } from '@app/condo/schema'
import { Typography } from 'antd'
import React, { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'


import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'

import { TicketUserInfoField } from './TicketUserInfoField'

type TicketExecutorFieldProps = {
    ticket: Ticket
    phonePrefix?: string
}

export const TicketExecutorField: React.FC<TicketExecutorFieldProps> = ({ ticket, phonePrefix }) => {
    const intl = useIntl()
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const EmployeeIsNullOrWasDeletedMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.EmployeeIsNullOrWasDeleted' })

    const ticketExecutorUserId = useMemo(() => ticket?.executor?.id || null, [ticket])
    const ticketOrganizationId = useMemo(() => ticket?.organization?.id || null, [ticket])

    const { persistor } = useCachePersistor()

    const {
        data,
    } = useGetOrganizationEmployeeByUserAndOrganizationIdsQuery({
        variables: {
            userId: ticketExecutorUserId,
            organizationId: ticketOrganizationId,
        },
        skip: !ticketExecutorUserId || !ticketOrganizationId || !persistor,
    })

    const executor = useMemo(() => data?.employee.filter(Boolean)[0] || null, [data?.employee])

    const executorUser = useMemo(() => ({
        name: executor?.name,
        phone: executor?.phone,
        email: executor?.email,
    }), [executor])

    return (
        <PageFieldRow title={ExecutorMessage} ellipsis>
            {
                executor
                    ? <Typography.Text strong>
                        <TicketUserInfoField
                            user={executorUser}
                            nameLink={`/employee/${executor?.id}`}
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
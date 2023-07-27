import { Ticket } from '@app/condo/schema'
import { Typography } from 'antd'
import { get } from 'lodash'
import { FC, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

import { TicketUserInfoField } from './TicketUserInfoField'


type TicketAssigneeFieldProps = {
    ticket: Ticket
    phonePrefix?: string
}

export const TicketAssigneeField: FC<TicketAssigneeFieldProps> = ({ ticket, phonePrefix }) => {
    const intl = useIntl()
    const AssigneeMessage = intl.formatMessage({ id: 'field.responsible' })
    const EmployeeIsNullOrWasDeletedMessage = intl.formatMessage({ id: 'ticket.field.employeeIsNullOrWasDeleted' })

    const ticketOrganizationId = useMemo(() => get(ticket, ['organization', 'id'], null), [ticket])
    const ticketAssigneeUserId = useMemo(() => get(ticket, ['assignee', 'id'], null), [ticket])

    const { obj: assignee } = OrganizationEmployee.useObject({
        where: {
            organization: {
                id: ticketOrganizationId,
            },
            user: {
                id: ticketAssigneeUserId,
            },
        },
    })

    const assigneeUser = useMemo(() => ({
        name: get(assignee, 'name'),
        phone: get(assignee, 'phone'),
        email: get(assignee, 'email'),
    }), [assignee])

    return (
        <PageFieldRow title={AssigneeMessage} ellipsis>
            {
                assignee
                    ?
                    <Typography.Text strong>
                        <TicketUserInfoField
                            user={assigneeUser}
                            nameLink={`/employee/${get(assignee, 'id')}`}
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
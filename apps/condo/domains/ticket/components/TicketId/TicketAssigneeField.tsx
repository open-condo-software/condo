import { Typography } from 'antd'
import { get } from 'lodash'
import Link from 'next/link'
import { useMemo } from 'react'

import { useIntl } from '@core/next/intl'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { TICKET_CARD_LINK_STYLE } from '@condo/domains/ticket/constants/style'

import { TicketUserInfoField } from './TicketUserInfoField'

export const TicketAssigneeField = ({ ticket }) => {
    const intl = useIntl()
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const EmployeeIsNullOrWasDeletedMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.EmployeeIsNullOrWasDeleted' })

    const ticketOrganizationId = useMemo(() => get(ticket, ['organization', 'id'], null), [])
    const ticketAssigneeUserId = useMemo(() => get(ticket, ['assignee', 'id'], null), [])

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
        <PageFieldRow title={AssigneeMessage}>
            {
                assignee
                    ? <Link href={`/employee/${get(assignee, 'id')}`}>
                        <Typography.Link style={TICKET_CARD_LINK_STYLE}>
                            <Typography.Text strong>
                                <TicketUserInfoField user={assigneeUser}/>
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
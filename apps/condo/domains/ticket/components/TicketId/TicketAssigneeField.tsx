import { useGetOrganizationEmployeeByUserAndOrganizationIdsQuery } from '@app/condo/gql'
import { Ticket } from '@app/condo/schema'
import { Typography } from 'antd'
import { FC, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'

import { PageFieldRow } from '@condo/domains/common/components/PageFieldRow'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'

import { TicketUserInfoField } from './TicketUserInfoField'



type TicketAssigneeFieldProps = {
    ticket: Ticket
    phonePrefix?: string
}

export const TicketAssigneeField: FC<TicketAssigneeFieldProps> = ({ ticket, phonePrefix }) => {
    console.log('Render TicketAssigneeField start')
    const intl = useIntl()
    const AssigneeMessage = intl.formatMessage({ id: 'field.Responsible' })
    const EmployeeIsNullOrWasDeletedMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.EmployeeIsNullOrWasDeleted' })
    const ticketOrganizationId = useMemo(() => ticket?.organization?.id || null, [ticket])
    const ticketAssigneeUserId = useMemo(() => ticket?.assignee?.id, [ticket])

    const { persistor } = useCachePersistor()

    // const { obj: assignee } = OrganizationEmployee.useObject({
    //     where: {
    //         organization: {
    //             id: ticketOrganizationId,
    //         },
    //         user: {
    //             id: ticketAssigneeUserId,
    //         },
    //     },
    // })

    const {
        data,
    } = useGetOrganizationEmployeeByUserAndOrganizationIdsQuery({
        variables: {
            userId: ticketAssigneeUserId,
            organizationId: ticketOrganizationId,
        },
        skip: !ticketAssigneeUserId || !ticketOrganizationId || !persistor,
    })

    const assignee = useMemo(() => data?.employee.filter(Boolean)[0] || null, [data?.employee])

    const assigneeUser = useMemo(() => ({
        name: assignee?.name,
        phone: assignee?.phone,
        email: assignee?.email,
    }), [assignee])

    return (
        <PageFieldRow title={AssigneeMessage} ellipsis>
            {
                assignee
                    ?
                    <Typography.Text strong>
                        <TicketUserInfoField
                            user={assigneeUser}
                            nameLink={`/employee/${assignee?.id}`}
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
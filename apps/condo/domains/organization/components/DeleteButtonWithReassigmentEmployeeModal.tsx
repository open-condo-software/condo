import get from 'lodash/get'
import React, { useState } from 'react'

import { useLazyQuery, useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Modal, Space, Typography } from '@open-condo/ui'

import { GraphQlSearchInput } from '@/domains/common/components/GraphQlSearchInput'
import { searchEmployeeUser } from '@/domains/ticket/utils/clientSchema/search'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { GET_ACTIVE_TICKETS_ORGANIZATION_EMPLOYEE_QUERY, REASSIGNEMENT_ACTIVE_TICKET_DELETE_ORGANIZATION_EMPLOYEE_UPDATE_MUTATION } from '@condo/domains/ticket/gql'

export interface IDeleteActionButtonWithConfirmModal {
    title: string
    buttonContent?: string
    action: () => Promise<any>
    disabled?: boolean
    employeeActiveTicketCount: number
}

export const DeleteButtonWithReassigmentEmployeeModal = ({
    title,
    buttonContent,
    employee,
    disabled = false,
    employeeActiveTicketCount,
}) => {
    const intl = useIntl()
    const searchPlaceholderMessage = 'ФИО сотрудника'
    const deleteEmployeeButtonLabel = 'Удалить сотрудника' || intl.formatMessage({ id: 'Cancel' })
    const messageTitleLabel = `${get(employee, ['user', 'name'])} назначен на несколько заявок (${employeeActiveTicketCount} шт.)`
    const messageDescriptionLabel =
        <Space direction='vertical' size={8}>
            <Typography.Paragraph>
                Чтобы не потерять их, назначьте нового исполнителя среди сотрудников
            </Typography.Paragraph>
            <Typography.Link href='/ticket' target='_blank'>Показать заявки</Typography.Link>
        </Space>

    const { organization } = useOrganization()

    const [loadActiveTicketsOrganizationEmployeeTickets] = useLazyQuery(GET_ACTIVE_TICKETS_ORGANIZATION_EMPLOYEE_QUERY)
    const [updateActiveTicketsDeletedOrganizationEmployee] = useMutation(REASSIGNEMENT_ACTIVE_TICKET_DELETE_ORGANIZATION_EMPLOYEE_UPDATE_MUTATION)

    const [isConfirmVisible, setIsConfirmVisible] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const showConfirm = () => setIsConfirmVisible(true)
    const handleCancel = () => setIsConfirmVisible(false)
    const [search, setSearch] = useState()

    const userEmployeeId = get(employee, ['user', 'id'], null)

    const onChange = (search) => setSearch(search)

    const checkExecutorOrAssignee = (ticket) => {
        const resultObj = {}
        if (ticket.executor.id === userEmployeeId) resultObj['executor'] = { connect: { id: search } }
        if (ticket.assignee.id === userEmployeeId) resultObj['assignee'] = { connect: { id: search } }
        return resultObj
    }

    const handleDeleteButtonClick = async () => {
        setIsConfirmVisible(false)
        setIsDeleting(true)

        const CHANK = 100
        let SKIP = 0

        while (employeeActiveTicketCount > 0) {
            const { data } = await loadActiveTicketsOrganizationEmployeeTickets({
                variables: {
                    where: {
                        organization: { id: organization?.id },
                        OR: [
                            { assignee: { id: userEmployeeId } },
                            { executor: { id: userEmployeeId } },
                        ],
                    },
                    first: CHANK,
                    skip: SKIP,
                },
                fetchPolicy: 'no-cache',
            })
            console.log('data', data)

            await updateActiveTicketsDeletedOrganizationEmployee({
                variables: {
                    data: data?.objs?.map(ticket => ({
                        id: ticket.id,
                        data: checkExecutorOrAssignee(ticket),
                    })),
                },
            })
            employeeActiveTicketCount = employeeActiveTicketCount - 100
            SKIP = SKIP + CHANK
        }


        setIsDeleting(false)

        // let tickets =
        //
        // while (tickets.lenght) {
        //
        // }
        // runMutation(
        //     {
        //         action: () => reassignEmployeeAction(),
        //         onError: (e) => {
        //             console.log(e)
        //             console.error(e.friendlyDescription)
        //             throw e
        //         },
        //         intl,
        //     },
        // ).then(() => {
        // })
    }

    return (
        <>
            <Button
                key='submit'
                onClick={showConfirm}
                type='secondary'
                loading={isDeleting}
                danger
                disabled={disabled}
            >
                {buttonContent}
            </Button>
            <Modal
                title={title}
                open={isConfirmVisible}
                onCancel={handleCancel}
                footer={
                    <Button
                        key='submit'
                        type='primary'
                        onClick={handleDeleteButtonClick}
                    >
                        {deleteEmployeeButtonLabel}
                    </Button>
                }
            >
                <Alert
                    type='error'
                    showIcon
                    message={messageTitleLabel}
                    description={messageDescriptionLabel}
                >
                </Alert>
                <GraphQlSearchInput
                    search={searchEmployeeUser(organization.id, (organizationEmployee) => (
                        get(organizationEmployee, ['user', 'id'], null) !== userEmployeeId
                    ))}
                    value={search}
                    onChange={onChange}
                    style={{ width: '100%' }}
                    placeholder={searchPlaceholderMessage}
                />
            </Modal>
        </>

    )
}

import { useGetOrganizationEmployeeTicketsLazyQuery, useUpdateTicketsMutation } from '@app/condo/gql'
import { TicketStatusTypeType } from '@app/condo/schema'
import { notification, Row } from 'antd'
import get from 'lodash/get'
import React, { useState } from 'react'

import { ArrowDownUp } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { sleep } from '@condo/domains/common/utils/sleep'
import { searchEmployeeUser } from '@condo/domains/ticket/utils/clientSchema/search'


export interface IDeleteActionButtonWithConfirmModal {
    buttonContent?: string
    action: () => Promise<any>
    disabled?: boolean
    employeeUserId: string
    employeeName: string
    organizationId: string
    activeTicketsOrganizationEmployeeCount: number
}

const CHUNK_SIZE = 100

export const DeleteButtonWithReassignmentEmployeeModal = ({
    buttonContent,
    employeeUserId,
    employeeName,
    action,
    organizationId,
    disabled = false,
    activeTicketsOrganizationEmployeeCount,
}) => {
    const intl = useIntl()
    const ConfirmReassignEmployeeTitle = intl.formatMessage({ id: 'employee.reassignTickets.title' })
    const ConfirmDeleteButtonLabel = intl.formatMessage({ id: 'employee.reassignTickets.deleteUser' })
    const SearchPlaceholderLabel = intl.formatMessage({ id: 'EmployeesName' })
    const AlertTitleLabel = intl.formatMessage({ id: 'employee.reassignTickets.alert.title' }, { activeTicketsOrganizationEmployeeCount, employeeName })
    const AlertMessageLabel = intl.formatMessage({ id: 'employee.reassignTickets.alert.message' })
    const ShowTicketsLabel = intl.formatMessage({ id: 'employee.reassignTickets.showTickets' })
    const NotificationWarningLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.warning' })
    const NotificationSuccessLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.success' })
    const NotificationTitleLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.title' })

    const [notificationApi, contextHolder] = notification.useNotification()

    const filterTicket = `{"search":"${employeeName}", "status":["new_or_reopened","processing","completed","deferred"]}`
    const linkToFilteredTickets = `/ticket?filters=${encodeURIComponent(filterTicket)}`

    const [searchOrganizationEmployees, setSearchOrganizationEmployees] = useState()
    const onChange = (searchOrganizationEmployees) => setSearchOrganizationEmployees(searchOrganizationEmployees)

    const [isDeleting, setIsDeleting] = useState(false)
    const [isConfirmVisible, setIsConfirmVisible] = useState(false)

    const showConfirm = () => setIsConfirmVisible(true)
    const handleCancel = () => setIsConfirmVisible(false)
    
    const [loadTicketsToReassign] = useGetOrganizationEmployeeTicketsLazyQuery({
        variables: {
            where: {
                organization: { id: organizationId },
                OR: [
                    { assignee: { id: employeeUserId } },
                    { executor: { id: employeeUserId } },
                ],
                status: {
                    type_in: [
                        TicketStatusTypeType.NewOrReopened,
                        TicketStatusTypeType.Processing,
                        TicketStatusTypeType.Completed,
                        TicketStatusTypeType.Deferred,
                    ],
                },
            },
            first: CHUNK_SIZE,
        },
        fetchPolicy: 'no-cache',
    })
    const [updateTicketsWithReassignOrganizationEmployee] = useUpdateTicketsMutation()

    const checkExecutorOrAssignee = (ticket) => {
        const resultObj = {}
        if (ticket.executor.id === employeeUserId) resultObj['executor'] = { connect: { id: searchOrganizationEmployees } }
        if (ticket.assignee.id === employeeUserId) resultObj['assignee'] = { connect: { id: searchOrganizationEmployees } }
        return resultObj
    }

    const notificationTitle = (notificationStatus) => <Typography.Text strong>{notificationStatus}</Typography.Text>
    const notificationMessage = (notificationTitleLabel, updatedTicketsCount?) => {
        return (
            <Space direction='vertical' size={4}>
                <Typography.Text strong>
                    {notificationTitleLabel}
                </Typography.Text>
                <Typography.Text>
                    {intl.formatMessage({ id: 'employee.reassignTickets.notification.message' }, { activeTicketsOrganizationEmployeeCount, updatedTicketsCount })}
                </Typography.Text>
            </Space>
        )
    }

    const handleDeleteButtonClick = async () => {
        setIsDeleting(true)
        setIsConfirmVisible(false)

        let updatedTicketsCount = 0

        while (updatedTicketsCount < activeTicketsOrganizationEmployeeCount) {
            console.log('updatedTicketsCount', updatedTicketsCount)
            notificationApi.warning({
                message: notificationTitle(NotificationWarningLabel),
                description: notificationMessage(NotificationTitleLabel, updatedTicketsCount),
                duration: 0,
                key: 'reassignTicket',
            })

            const { data: ticketsToReassign } = await loadTicketsToReassign()

            const { data: reassignedTickets }  = await updateTicketsWithReassignOrganizationEmployee({
                variables: {
                    data: get(ticketsToReassign, 'tickets', []).map(ticket => ({
                        id: get(ticket, 'id', null),
                        data: checkExecutorOrAssignee(ticket),
                    })),
                },
            })

            if (get(ticketsToReassign, 'tickets', []).length !== get(reassignedTickets, 'tickets', []).length) {
                notificationApi.error({
                    message: notificationTitle('Ошибка'),
                    description: notificationMessage('Повторите попытку'),
                    duration: 0,
                    key: 'reassignTicket',
                })
                return
            }
            updatedTicketsCount += get(reassignedTickets, 'tickets', []).length
            await sleep(300)
        }

        runMutation(
            {
                action,
                onError: (e) => {
                    console.log(e)
                    console.error(e.friendlyDescription)
                    throw e
                },
                intl,
            },
        ).then(() => {
            setIsDeleting(false)
            notificationApi.success({
                message: notificationTitle(NotificationSuccessLabel),
                description: notificationMessage(NotificationTitleLabel, updatedTicketsCount),
                duration: 0,
                key: 'reassignTicket',
            })
        })
    }

    return (
        <>
            {contextHolder}
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
                title={ConfirmReassignEmployeeTitle}
                open={isConfirmVisible}
                onCancel={handleCancel}
                footer={
                    <Button
                        key='submit'
                        type='primary'
                        loading={isDeleting}
                        onClick={handleDeleteButtonClick}
                    >
                        {ConfirmDeleteButtonLabel}
                    </Button>
                }
            >
                <Row justify='center' gutter={[0, 12]}>
                    <Alert
                        type='error'
                        showIcon
                        message={AlertTitleLabel}
                        description={
                            <Space direction='vertical' size={8}>
                                <Typography.Paragraph>{AlertMessageLabel}</Typography.Paragraph>
                                <Typography.Link href={linkToFilteredTickets} target='_blank'>{ShowTicketsLabel}</Typography.Link>
                            </Space>
                        }
                    >
                    </Alert>
                    <ArrowDownUp color={colors.gray[5]} />
                    <GraphQlSearchInput
                        search={searchEmployeeUser(organizationId, (organizationEmployee) => (
                            get(organizationEmployee, ['user', 'id'], null) !== employeeUserId
                        ))}
                        value={searchOrganizationEmployees}
                        onChange={onChange}
                        style={{
                            width: '100%',
                        }}
                        placeholder={SearchPlaceholderLabel}
                    />
                </Row>
            </Modal>
        </>

    )
}

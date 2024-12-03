import { useGetOrganizationEmployeeTicketsForReassignLazyQuery, useUpdateTicketsMutation } from '@app/condo/gql'
import { notification, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { useCallback, useState } from 'react'

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
    const NotificationTitleWarningLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.title.warning' })
    const NotificationTitleErrorLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.title.error' })
    const NotificationTitleSuccessLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.title.success' })
    const NotificationMessageWarningLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.message.warning' })
    const NotificationMessageErrorLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.message.error' })
    const NotificationMessageSuccessLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.message.success' })

    const [notificationApi, contextHolder] = notification.useNotification()

    const [newEmployeeUserId, setNewEmployeeUserId] = useState()
    const onChange = (newEmployeeUserId) => setNewEmployeeUserId(newEmployeeUserId)

    const [isDeleting, setIsDeleting] = useState(false)
    const [isConfirmVisible, setIsConfirmVisible] = useState(false)

    const showConfirm = () => setIsConfirmVisible(true)
    const handleCancel = () => setIsConfirmVisible(false)
    
    const [loadTicketsToReassign] = useGetOrganizationEmployeeTicketsForReassignLazyQuery({
        variables: {
            organizationId,
            userId: employeeUserId,
            first: CHUNK_SIZE,
        },
        fetchPolicy: 'no-cache',
    })
    const [updateTickets] = useUpdateTicketsMutation()

    const getTicketReassignData = (ticket) => {
        const resultObj = {}
        if (ticket.executor.id === employeeUserId) resultObj['executor'] = { connect: { id: newEmployeeUserId } }
        if (ticket.assignee.id === employeeUserId) resultObj['assignee'] = { connect: { id: newEmployeeUserId } }
        return resultObj
    }

    const notificationTitle = useCallback((notificationStatus) => <Typography.Text strong>{notificationStatus}</Typography.Text>, [])
    const notificationMessage = useCallback((notificationTitleLabel, updatedTicketsCount?) => {
        return (
            <Space direction='vertical' size={4}>
                <Typography.Text strong>
                    {notificationTitleLabel}
                </Typography.Text>
                <Typography.Text>
                    {intl.formatMessage({ id: 'employee.reassignTickets.notification.progress' }, { activeTicketsOrganizationEmployeeCount, updatedTicketsCount })}
                </Typography.Text>
            </Space>
        )
    }, [activeTicketsOrganizationEmployeeCount])

    const handleDeleteButtonClick = async () => {
        setIsDeleting(true)
        setIsConfirmVisible(false)

        let updatedTicketsCount = 0

        while (updatedTicketsCount < activeTicketsOrganizationEmployeeCount) {
            notificationApi.warning({
                message: notificationTitle(NotificationTitleWarningLabel),
                description: notificationMessage(NotificationMessageWarningLabel, updatedTicketsCount),
                duration: 0,
                key: 'reassignTicket',
            })

            const { data: ticketsToReassign } = await loadTicketsToReassign()

            if (isEmpty(get(ticketsToReassign, 'tickets'))) break
            const { data: reassignedTickets }  = await updateTickets({
                variables: {
                    data: get(ticketsToReassign, 'tickets').map(ticket => ({
                        id: get(ticket, 'id', null),
                        data: getTicketReassignData(ticket),
                    })),
                },
            })

            updatedTicketsCount += get(reassignedTickets, 'tickets', []).length
            await sleep(300)
        }

        runMutation(
            {
                action,
                onError: (e) => {
                    notificationApi.error({
                        message: notificationTitle(NotificationTitleErrorLabel),
                        description: notificationMessage(NotificationMessageErrorLabel),
                        duration: 0,
                        key: 'reassignTicket',
                    })
                    throw e
                },
                onCompleted: () => {
                    notificationApi.success({
                        message: notificationTitle(NotificationTitleSuccessLabel),
                        description: notificationMessage(NotificationMessageSuccessLabel, updatedTicketsCount),
                        duration: 0,
                        key: 'reassignTicket',
                    })
                },
                onFinally: () => {
                    setIsDeleting(false)
                },
                intl,
            },
        )
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
                            </Space>
                        }
                    >
                    </Alert>
                    <ArrowDownUp color={colors.gray[5]} />
                    <GraphQlSearchInput
                        search={searchEmployeeUser(organizationId, (organizationEmployee) => (
                            get(organizationEmployee, ['user', 'id'], null) !== employeeUserId
                        ))}
                        value={newEmployeeUserId}
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

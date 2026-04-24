import {
    GetOrganizationEmployeeTicketsForReassignmentQuery,
    useGetOrganizationEmployeeTicketsForReassignmentLazyQuery,
    useUpdateOrganizationEmployeeTicketsForReassignmentMutation,
} from '@app/condo/gql'
import { OrganizationEmployee } from '@app/condo/schema'
import { notification, Row } from 'antd'
import isEmpty from 'lodash/isEmpty'
import React, { useMemo, useCallback, useState } from 'react'

import { IUseSoftDeleteActionType } from '@open-condo/codegen/generate.hooks'
import { ArrowDownUp } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { Alert, Button, Modal, Space, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { sleep } from '@condo/domains/common/utils/sleep'
import { searchEmployeeUser } from '@condo/domains/ticket/utils/clientSchema/search'


type IDeleteEmployeeButtonWithReassignmentModel = {
    buttonContent: string
    softDeleteAction: IUseSoftDeleteActionType<OrganizationEmployee>
    disabled?: boolean
    employee: Pick<OrganizationEmployee, 'name'> & { organization?: 
    Pick<OrganizationEmployee['organization'], 'id'>, user?: 
    Pick<OrganizationEmployee['organization'], 'id'> }
    activeTicketsOrganizationEmployeeCount: number
}

const ERROR_NOTIFICATION_TYPE = 'error'
const WARNING_NOTIFICATION_TYPE = 'warning'
const SUCCESS_NOTIFICATION_TYPE = 'success'

const waitBetweenRequsted = async () => await sleep(1000)

export const DeleteEmployeeButtonWithReassignmentModel: React.FC<IDeleteEmployeeButtonWithReassignmentModel> = ({
    buttonContent,
    softDeleteAction,
    disabled = false,
    employee,
    activeTicketsOrganizationEmployeeCount,
}) => {
    const intl = useIntl()
    const ConfirmReassignEmployeeTitle = intl.formatMessage({ id: 'employee.reassignTickets.title' })
    const ConfirmDeleteButtonLabel = intl.formatMessage({ id: 'employee.reassignTickets.buttonContent.deleteUser' })
    const ConfirmReassignTicketsButtonLabel = intl.formatMessage({ id: 'employee.reassignTickets.buttonContent.reassignTickets' })
    const SearchPlaceholderLabel = intl.formatMessage({ id: 'EmployeesName' })
    const AlertTitleLabel = intl.formatMessage({ id: 'employee.reassignTickets.alert.title' }, { employeeName: employee?.name || null })
    const CountShortLabel = intl.formatMessage({ id: 'global.count.pieces.short' })
    const AlertMessageLabel = intl.formatMessage({ id: 'employee.reassignTickets.alert.message' })
    const NotificationTitleWarningLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.title.warning' })
    const NotificationTitleErrorLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.title.error' })
    const NotificationTitleSuccessLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.title.success' })
    const NotificationMessageWarningLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.message.warning' })
    const NotificationMessageErrorLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.message.error' })
    const NotificationMessageSuccessLabel = intl.formatMessage({ id: 'employee.reassignTickets.notification.message.success' })

    const [notificationApi, contextHolder] = notification.useNotification()

    const employeeUserId = employee?.user?.id || null
    const employeeOrganizationId = employee?.organization?.id || null

    const getTicketReassignData = (ticket: GetOrganizationEmployeeTicketsForReassignmentQuery['tickets'][number]) => {
        const resultObj = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }
        if (ticket?.executor?.id === employeeUserId) resultObj['executor'] = { connect: { id: newEmployeeUserId } }
        if (ticket?.assignee?.id === employeeUserId) resultObj['assignee'] = { connect: { id: newEmployeeUserId } }
        return resultObj
    }

    const getNotificationInfo = useCallback((notificationType: 'error' | 'warning' | 'success', updatedTicketsCount = null) => {
        switch (notificationType) {
            case ERROR_NOTIFICATION_TYPE:
                return {
                    message: <Typography.Text strong>{NotificationTitleErrorLabel}</Typography.Text>,
                    description: <Typography.Text>{NotificationMessageErrorLabel}</Typography.Text>,
                    duration: 0,
                    key: 'reassignTicket',
                }
            case WARNING_NOTIFICATION_TYPE:
                return {
                    message: <Typography.Text strong>{NotificationTitleWarningLabel}</Typography.Text>,
                    description: <Space direction='vertical' size={4}>
                        <Typography.Text>
                            {NotificationMessageWarningLabel}
                        </Typography.Text>
                        <Typography.Text>
                            {intl.formatMessage({ id: 'employee.reassignTickets.notification.progress' }, { activeTicketsOrganizationEmployeeCount, updatedTicketsCount })}
                        </Typography.Text>
                    </Space>,
                    duration: 0,
                    key: 'reassignTicket',
                }
            case SUCCESS_NOTIFICATION_TYPE:
                return {
                    message: <Typography.Text strong>{NotificationTitleSuccessLabel}</Typography.Text>,
                    description: <Space direction='vertical' size={4}>
                        <Typography.Text>
                            {NotificationMessageSuccessLabel}
                        </Typography.Text>
                        {updatedTicketsCount !== null && <Typography.Text>
                            {intl.formatMessage({ id: 'employee.reassignTickets.notification.progress' }, { activeTicketsOrganizationEmployeeCount, updatedTicketsCount })}
                        </Typography.Text>}
                    </Space>,
                    duration: 0,
                    key: 'reassignTicket',
                }
        }
    }, [intl, NotificationTitleSuccessLabel, NotificationTitleErrorLabel, NotificationTitleWarningLabel, NotificationMessageErrorLabel, NotificationMessageSuccessLabel, NotificationMessageWarningLabel, activeTicketsOrganizationEmployeeCount])

    const [newEmployeeUserId, setNewEmployeeUserId] = useState(null)
    const onChange = (newEmployeeUserId: string) => {
        setNewEmployeeUserId(newEmployeeUserId)
    }

    const [isDeleting, setIsDeleting] = useState(false)
    const [isConfirmVisible, setIsConfirmVisible] = useState(false)

    const showConfirm = () => setIsConfirmVisible(true)
    const handleCancel = () => setIsConfirmVisible(false)
    
    const [loadTicketsToReassign, { error: errorLoadTickets }] = useGetOrganizationEmployeeTicketsForReassignmentLazyQuery({
        variables: {
            organizationId: employeeOrganizationId,
            userId: employeeUserId,
            first: 100,
        },
        fetchPolicy: 'no-cache',
    })
    const [updateTickets, { error: errorUpdateTickets }] = useUpdateOrganizationEmployeeTicketsForReassignmentMutation()

    const handleDeleteButtonClick = () => {
        setIsDeleting(true)
        setIsConfirmVisible(false)

        runMutation(
            {
                action: softDeleteAction,
                onError: (e) => { throw e },
                OnErrorMsg: () => (getNotificationInfo(ERROR_NOTIFICATION_TYPE)),
                onFinally: () => setIsDeleting(false),
                intl,
            },
        )
    }
    
    const handleDeleteAndReassignTicketsClick = async () => {
        setIsDeleting(true)
        setIsConfirmVisible(false)

        let updatedTicketsCount = 0

        /* NOTE: push notifications for bulk tickets updates should not be sent here */
        while (updatedTicketsCount < activeTicketsOrganizationEmployeeCount) {
            notificationApi.warning(getNotificationInfo(WARNING_NOTIFICATION_TYPE, updatedTicketsCount))

            try {
                const { data: ticketsToReassign } = await loadTicketsToReassign()

                if (isEmpty(ticketsToReassign?.tickets)) break
                const { data: reassignedTickets }  = await updateTickets({
                    variables: {
                        data: ticketsToReassign?.tickets?.filter(Boolean).map(ticket => ({
                            id: ticket?.id,
                            data: getTicketReassignData(ticket),
                        })),
                    },
                })
                
                updatedTicketsCount += reassignedTickets?.tickets?.length
                await waitBetweenRequsted()
            } catch (err) {
                if (errorLoadTickets || errorUpdateTickets || err) notificationApi.error(getNotificationInfo(ERROR_NOTIFICATION_TYPE))
                setIsDeleting(false)
                return
            }
        }
        
        runMutation(
            {
                action: softDeleteAction,
                onError: (e) => { throw e },
                OnErrorMsg: () => (getNotificationInfo(ERROR_NOTIFICATION_TYPE)),
                OnCompletedMsg: () => (getNotificationInfo(SUCCESS_NOTIFICATION_TYPE, updatedTicketsCount)),
                intl,
            },
        )
        setIsDeleting(false)
    }

    // TODO: DOMA-10834 add search for an employee along with specialization
    const search = useMemo(() => {
        return searchEmployeeUser(employeeOrganizationId, (organizationEmployee: OrganizationEmployee) => {
            return organizationEmployee?.isBlocked ? false : organizationEmployee.user.id !== employeeUserId
        })
    }, [employeeOrganizationId, employeeUserId])

    return (
        <>
            {contextHolder}
            <Button
                key='submit'
                onClick={showConfirm}
                type='secondary'
                loading={isDeleting}
                danger
                disabled={disabled || !employeeOrganizationId || !employeeUserId}
            >
                {buttonContent}
            </Button>
            <Modal
                title={ConfirmReassignEmployeeTitle}
                open={isConfirmVisible}
                onCancel={handleCancel}
                footer={<Button
                    key='submit'
                    type='primary'
                    loading={isDeleting}
                    onClick={newEmployeeUserId ? handleDeleteAndReassignTicketsClick : handleDeleteButtonClick}
                >
                    {newEmployeeUserId ? ConfirmReassignTicketsButtonLabel : ConfirmDeleteButtonLabel}
                </Button>
                }
            >
                <Row justify='center' gutter={[0, 12]}>
                    <Alert
                        type='error'
                        showIcon
                        message={<Typography.Text strong>{AlertTitleLabel} ({activeTicketsOrganizationEmployeeCount}&nbsp;{CountShortLabel})</Typography.Text>}
                        description={<Typography.Paragraph>{AlertMessageLabel}</Typography.Paragraph>}
                    />
                    <ArrowDownUp color={colors.gray[5]} />
                    <GraphQlSearchInput
                        search={search}
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

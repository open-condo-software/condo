import { jsx } from '@emotion/react'
import { Form, notification } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Modal, Select, Space, Typography } from '@open-condo/ui'

import { EmployeeRoleSelect } from './EmployeeRoleSelect'

import {
    GetRequestsForUserOrganizationsQueryResult,
    useAcceptOrRejectOrganizationEmployeeRequestMutation, useGetOrganizationEmployeeRolesByOrganizationQuery,
    useGetRequestsForUserOrganizationsQuery,
} from '../../../gql'
import { useLayoutContext } from '../../common/components/LayoutContext'
import { useMutationErrorHandler } from '../../common/hooks/useMutationErrorHandler'
import { formatPhone } from '../../common/utils/helpers'
import { getClientSideSenderInfo } from '../../common/utils/userid.utils'


type ActiveOrganizationRequestType = GetRequestsForUserOrganizationsQueryResult['data']['requests'][number] | null

export const OrganizationEmployeeRequests = () => {
    const intl = useIntl()
    const AcceptMessage = intl.formatMessage({ id: 'Accept' })
    const RejectMessage = intl.formatMessage({ id: 'Reject' })
    const DoneMessage = intl.formatMessage({ id: 'OperationCompleted' })
    const ServerErrorMessage = intl.formatMessage({ id: 'ServerError' })

    const { user, isAuthenticated } = useAuth()
    const { employee } = useOrganization()
    const { addNotification, removeNotification } = useLayoutContext()

    const [form] = Form.useForm()

    const [activeRequest, setActiveRequest] = useState<ActiveOrganizationRequestType>(null)

    const onError = useMutationErrorHandler()
    const {
        data: userOrganizationsRequestsData,
        refetch: refetchOrganizationsRequests,
    } = useGetRequestsForUserOrganizationsQuery({
        variables: {
            userId: user?.id,
        },
        onError,
        skip: !isAuthenticated || !employee,
    })
    const [acceptOrRejectRequest] = useAcceptOrRejectOrganizationEmployeeRequestMutation({
        onError,
    })

    const { data: employeeRolesData } = useGetOrganizationEmployeeRolesByOrganizationQuery({
        variables: {
            organizationId: activeRequest?.organizationId,
        },
        skip: !activeRequest,
    })
    const employeeRoles = useMemo(() => employeeRolesData?.roles, [employeeRolesData?.roles])

    userOrganizationsRequestsData?.requests?.map((request) => {
        addNotification({
            actions: [
                {
                    action: async () => {
                        await acceptOrRejectRequest({
                            variables: {
                                data: {
                                    dv: 1,
                                    sender: getClientSideSenderInfo(),
                                    isAccepted: false,
                                    isRejected: true,
                                    employeeRequest: { id: request.id },
                                },
                            },
                        })
                        await refetchOrganizationsRequests()
                    },
                    title: RejectMessage,
                    secondary: true,
                    removeNotificationOnClick: true,
                },
                {
                    action: async () => {setActiveRequest(request)},
                    title: 'Подтвердить',
                    removeNotificationOnClick: false,
                },
            ],
            message: `${request.userName} хочет добавиться к организации ${request.organizationName}`,
            description: formatPhone(request.userPhone),
            type: 'info',
            id: `request_${request.id}`,
        })
    })

    const closeChooseRoleModal = useCallback(() => {
        setActiveRequest(null)
        form.resetFields()
    }, [form])

    const handleAcceptRequest = useCallback(async (values) => {
        const roleId = values['role']

        if (!activeRequest || !roleId) {
            closeChooseRoleModal()
        }

        await acceptOrRejectRequest({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    isAccepted: true,
                    isRejected: false,
                    employeeRequest: { id: activeRequest.id },
                    employeeData: { role: { id: roleId } },
                },
            },
        })

        notification.success({ message: `${activeRequest.userName} добавлен в ${activeRequest.organizationName}` })

        removeNotification(`request_${activeRequest.id}`)
        await refetchOrganizationsRequests()
        closeChooseRoleModal()
    }, [acceptOrRejectRequest, activeRequest, closeChooseRoleModal, refetchOrganizationsRequests, removeNotification])

    const employeeRolesOptions = useMemo(() => employeeRoles?.map((role) => ({
        value: role.id,
        label: role.name,
    })), [employeeRoles])

    return (
        <Modal
            open={!!activeRequest && !!employeeRoles}
            onCancel={closeChooseRoleModal}
            title={(
                <Space size={8} direction='vertical'>
                    <Typography.Title level={3}>Выбери роль сотрудника</Typography.Title>
                    <Typography.Text type='secondary'>{activeRequest?.userName}</Typography.Text>
                </Space>
            )}
            footer={(
                <Button type='primary' onClick={() => form.submit()}>
                    Сохранить
                </Button>
            )}
        >
            <Form
                form={form}
                onFinish={handleAcceptRequest}
                layout='vertical'
            >
                <Space size={40} direction='vertical'>
                    <Form.Item name='role' noStyle initialValue={employeeRolesOptions?.[0]?.value}>
                        <Select
                            options={employeeRolesOptions}
                        />
                    </Form.Item>
                    <Form.Item shouldUpdate noStyle>
                        {
                            ({ getFieldValue }) => {
                                const roleId = getFieldValue('role')
                                if (!roleId) return

                                const role = employeeRoles?.find(role => role.id === roleId)

                                return (
                                    <Alert
                                        type='info'
                                        showIcon
                                        message={intl.formatMessage({ id: 'employee.Role.whoIs' }, { roleName: role.name.toLowerCase() })}
                                        description={role.description}
                                    />
                                )
                            }
                        }
                    </Form.Item>
                </Space>
            </Form>
        </Modal>
    )
}
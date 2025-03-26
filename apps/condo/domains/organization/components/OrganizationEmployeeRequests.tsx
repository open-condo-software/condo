import {
    AcceptOrRejectOrganizationEmployeeRequestMutationFn, GetOrganizationEmployeeRolesByOrganizationQueryResult,
    GetRequestsForUserOrganizationsQueryResult,
    useAcceptOrRejectOrganizationEmployeeRequestMutation, useGetOrganizationEmployeeRolesByOrganizationQuery,
    useGetRequestsForUserOrganizationsQuery,
} from '@app/condo/gql'
import { Form, notification } from 'antd'
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Modal, Select, Space, Typography } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { formatPhone } from '@condo/domains/common/utils/helpers'


type ActiveOrganizationRequestType = GetRequestsForUserOrganizationsQueryResult['data']['requests'][number] | null

type ChooseEmployeeRoleModalProps = {
    activeRequest: ActiveOrganizationRequestType
    setActiveRequest: Dispatch<SetStateAction<ActiveOrganizationRequestType>>
    acceptOrRejectRequest: AcceptOrRejectOrganizationEmployeeRequestMutationFn
    refetchOrganizationsRequests: GetRequestsForUserOrganizationsQueryResult['refetch']
    employeeRoles: GetOrganizationEmployeeRolesByOrganizationQueryResult['data']['roles']
}

const ChooseEmployeeRoleModal: FC<ChooseEmployeeRoleModalProps> = ({
    activeRequest,
    setActiveRequest,
    acceptOrRejectRequest,
    refetchOrganizationsRequests,
    employeeRoles,
}) => {
    const intl = useIntl()
    const SuccessNotificationMessage = intl.formatMessage(
        { id: 'organization.employeeRequest.successNotification' },
        {
            userName: activeRequest?.userName,
            organizationName: activeRequest?.organizationName,
        }
    )
    const ChooseRoleMessage = intl.formatMessage({ id: 'organization.employeeRequest.chooseRole' })
    const SaveMessage = intl.formatMessage({ id: 'Save' })

    const { removeNotification } = useLayoutContext()

    const [form] = Form.useForm()

    const closeChooseRoleModal = useCallback(() => {
        setActiveRequest(null)
        form.resetFields()
    }, [form, setActiveRequest])

    const handleAcceptRequest = useCallback(async (values) => {
        const roleId = values['role']

        if (!activeRequest || !roleId) {
            closeChooseRoleModal()
            return
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

        notification.success({ message: SuccessNotificationMessage })

        await refetchOrganizationsRequests()
        removeNotification(`request_${activeRequest.id}`)
        closeChooseRoleModal()
    }, [SuccessNotificationMessage, acceptOrRejectRequest, activeRequest, closeChooseRoleModal, refetchOrganizationsRequests, removeNotification])

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
                    <Typography.Title level={3}>{ChooseRoleMessage}</Typography.Title>
                    <Typography.Text type='secondary'>{activeRequest?.userName}</Typography.Text>
                </Space>
            )}
            footer={(
                <Button type='primary' onClick={() => form.submit()}>
                    {SaveMessage}
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
                                        message={intl.formatMessage({ id: 'employee.Role.whoIs' }, { roleName: role?.name?.toLowerCase() })}
                                        description={role?.description}
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

export const OrganizationEmployeeRequests = () => {
    const intl = useIntl()
    const AcceptMessage = intl.formatMessage({ id: 'Confirm' })
    const RejectMessage = intl.formatMessage({ id: 'Reject' })

    const { user, isAuthenticated } = useAuth()
    const { employee } = useOrganization()
    const { addNotification } = useLayoutContext()

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

    useDeepCompareEffect(() => {
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
                        title: AcceptMessage,
                        removeNotificationOnClick: false,
                    },
                ],
                message: intl.formatMessage(
                    { id: 'organization.employeeRequest.message' },
                    {
                        userName: request?.userName,
                        organizationName: request?.organizationName,
                    }
                ),
                description: formatPhone(request.userPhone),
                type: 'info',
                id: `request_${request.id}`,
            })
        })
    }, [userOrganizationsRequestsData?.requests])

    if (!employeeRoles) {
        return null
    }

    return (
        <ChooseEmployeeRoleModal
            activeRequest={activeRequest}
            setActiveRequest={setActiveRequest}
            acceptOrRejectRequest={acceptOrRejectRequest}
            refetchOrganizationsRequests={refetchOrganizationsRequests}
            employeeRoles={employeeRoles}
        />
    )
}
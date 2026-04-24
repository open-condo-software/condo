import {
    AcceptOrRejectOrganizationEmployeeRequestMutationFn, GetOrganizationEmployeeRolesByOrganizationQueryResult,
    GetRequestsForUserOrganizationsQueryResult,
    useAcceptOrRejectOrganizationEmployeeRequestMutation, useGetOrganizationEmployeeRolesByOrganizationQuery,
    useGetRequestsForUserOrganizationsQuery, useGetActualOrganizationEmployeesQuery,
} from '@app/condo/gql'
import { Form, notification } from 'antd'
import { Dispatch, FC, SetStateAction, useCallback, useMemo, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Button, Modal, Select, Space, Typography } from '@open-condo/ui'

import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { HIDE_ORGANIZATION_REQUESTS } from '@condo/domains/common/constants/featureflags'
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
            console.error('Failed to accept or reject request', activeRequest, roleId)
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

    if (!employeeRoles) {
        return null
    }

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
                size='small'
                form={form}
                onFinish={handleAcceptRequest}
                layout='vertical'
            >
                <Space size={40} direction='vertical'>
                    <FormItem name='role' noStyle initialValue={employeeRolesOptions?.[0]?.value}>
                        <Select
                            options={employeeRolesOptions}
                        />
                    </FormItem>
                    <FormItem shouldUpdate noStyle>
                        {
                            ({ getFieldValue }) => {
                                const roleId = getFieldValue('role')
                                if (!roleId) return

                                const role = employeeRoles?.find(role => role.id === roleId)

                                return role?.description && (
                                    <Alert
                                        type='info'
                                        showIcon
                                        message={intl.formatMessage({ id: 'employee.Role.whoIs' }, { roleName: role?.name?.toLowerCase() })}
                                        description={role?.description}
                                    />
                                )
                            }
                        }
                    </FormItem>
                </Space>
            </Form>
        </Modal>
    )
}

export const useOrganizationEmployeeRequests = () => {
    const intl = useIntl()
    const AcceptMessage = intl.formatMessage({ id: 'Confirm' })
    const RejectMessage = intl.formatMessage({ id: 'Reject' })

    const { persistor } = useCachePersistor()
    const { user, isAuthenticated, isLoading: userIsLoading } = useAuth()
    const userId = useMemo(() => user?.id, [user?.id])
    const { employee } = useOrganization()
    const { addNotification } = useLayoutContext()
    const { useFlag } = useFeatureFlags()
    const isOrganizationRequestsHidden = useFlag(HIDE_ORGANIZATION_REQUESTS)

    const [activeRequest, setActiveRequest] = useState<ActiveOrganizationRequestType>(null)

    const onError = useMutationErrorHandler()
    const {
        data: actualEmployeesData,
        loading: isEmployeesLoading,
    } = useGetActualOrganizationEmployeesQuery({
        variables: { userId },
        skip: !isAuthenticated || userIsLoading || !persistor || isOrganizationRequestsHidden,
    })
    const actualEmployees = useMemo(() => actualEmployeesData?.actualEmployees?.filter(Boolean) || [], [actualEmployeesData?.actualEmployees])
    const userOrganizationIds = useMemo(() => actualEmployees
        ?.map(employee => employee?.organization?.id)
        ?.filter(Boolean)
    , [actualEmployees])

    const {
        data: userOrganizationsRequestsData,
        refetch: refetchOrganizationsRequests,
    } = useGetRequestsForUserOrganizationsQuery({
        variables: {
            userId: user?.id,
            userOrganizationIds,
        },
        onError,
        skip: !persistor || isEmployeesLoading || userIsLoading || !isAuthenticated || !employee || isOrganizationRequestsHidden || !userOrganizationIds.length,
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
        userOrganizationsRequestsData?.requests?.filter(Boolean)?.map((request) => {
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
                    },
                    {
                        action: async () => {setActiveRequest(request)},
                        title: AcceptMessage,
                        keepNotificationOnClick: true,
                    },
                ],
                message: intl.formatMessage(
                    { id: 'organization.employeeRequest.message' },
                    {
                        userName: request?.userName,
                        organizationName: request?.organizationName,
                    }
                ),
                description: request?.userPhone && formatPhone(request.userPhone),
                type: 'info',
                id: `request_${request.id}`,
            })
        })
    }, [userOrganizationsRequestsData?.requests])

    return useMemo(() => ({
        ChooseEmployeeRoleModal: (
            <ChooseEmployeeRoleModal
                activeRequest={activeRequest}
                setActiveRequest={setActiveRequest}
                acceptOrRejectRequest={acceptOrRejectRequest}
                refetchOrganizationsRequests={refetchOrganizationsRequests}
                employeeRoles={employeeRoles}
            />
        ),
    }), [acceptOrRejectRequest, activeRequest, employeeRoles, refetchOrganizationsRequests])
}
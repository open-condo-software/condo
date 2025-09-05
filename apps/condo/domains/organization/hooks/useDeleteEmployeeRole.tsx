import { OrganizationEmployeeRole as IEmployeeRole } from '@app/condo/schema'
import { Col, Form, FormInstance, notification, Row } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { Button, ButtonProps, Modal, Select, SelectProps, Tooltip, Typography } from '@open-condo/ui'

import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { useMutationErrorHandler } from '@condo/domains/common/hooks/useMutationErrorHandler'
import { REPLACE_ORGANIZATION_EMPLOYEE_ROLE_MUTATION } from '@condo/domains/organization/gql'


type UseDeleteEmployeeRole = (employeeRoles?: Array<IEmployeeRole>, employeeRoleToDelete?: IEmployeeRole, currentEmployeeRole?: Pick<IEmployeeRole, 'id'>) => {
    DeleteRoleButton: React.FC<Omit<ButtonProps, 'type' | 'danger' | 'onClick' | 'children'>>
    DeleteRoleModal: JSX.Element
}

export const useDeleteEmployeeRole: UseDeleteEmployeeRole = (employeeRoles = [], employeeRoleToDelete, currentEmployeeRole) => {
    const intl = useIntl()
    const ModalTitle = intl.formatMessage({ id: 'pages.condo.employeeRole.deleteRole.modal.title' }, { oldRole: get(employeeRoleToDelete, 'name') })
    const ModalDescription = intl.formatMessage({ id: 'pages.condo.employeeRole.deleteRole.modal.description' }, { oldRole: get(employeeRoleToDelete, 'name') })
    const DeleteRoleLabel = intl.formatMessage({ id: 'pages.condo.employeeRole.deleteRole.button.label' })
    const NewRolePlaceholder = intl.formatMessage({ id: 'pages.condo.employeeRole.deleteRole.newRole.placeholder' })
    const NewRoleLabel = intl.formatMessage({ id: 'pages.condo.employeeRole.deleteRole.newRole.label' })
    const DeletingSuccessfullyMessage = intl.formatMessage({ id: 'pages.condo.employeeRole.deleteRole.notification.success.message' })
    const DefaultRoleTooltip = intl.formatMessage({ id: 'pages.condo.employeeRole.tooltip.defaultRole' })
    const NotEditableRoleTooltip = intl.formatMessage({ id: 'pages.condo.employeeRole.tooltip.notEditableRole' }, { role: get(employeeRoleToDelete, 'name') })
    const MyRoleToDeleteTooltip = intl.formatMessage({ id: 'pages.condo.employeeRole.tooltip.myRoleToDelete' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })

    const router = useRouter()

    const formRef = useRef<FormInstance>(null)
    const loadingRef = useRef<boolean>(false)

    const [isOpen, setOpen] = useState<boolean>(false)

    const onError = useMutationErrorHandler()
    const [replaceRole] = useMutation(REPLACE_ORGANIZATION_EMPLOYEE_ROLE_MUTATION, {
        onError: (error) => {
            console.error({ msg: 'failed to delete employee role', error })
            onError(error)
        },
        onCompleted: async () => {
            const newRoleId = formRef.current.getFieldValue('newRole')
            const newRole = (employeeRoles || []).find(item => get(item, 'id') === newRoleId)
            const newRoleName = get(newRole, 'name')
            const oldRoleName = get(employeeRoleToDelete, 'name')
            notification.success({
                message: <Typography.Title level={4}>{DeletingSuccessfullyMessage}</Typography.Title>,
                description: <Typography.Paragraph type='secondary'>
                    {intl.formatMessage(
                        { id: 'pages.condo.employeeRole.deleteRole.notification.success.description' },
                        { newRole: newRoleName, oldRole: oldRoleName }
                    )}
                </Typography.Paragraph>,
            })
            await router.push('/settings?tab=employeeRoles')
        },
    })

    const currentRoleId = get(currentEmployeeRole, 'id')
    const roleIdToDelete = get(employeeRoleToDelete, 'id')
    const organizationId = get(employeeRoleToDelete, 'organization.id')
    const isEditableRole = get(employeeRoleToDelete, 'isEditable', false)
    const isDefaultRole = get(employeeRoleToDelete, 'isDefault', true)
    const isMyRoleToDelete = roleIdToDelete === currentRoleId

    const options: SelectProps['options'] = useMemo(() => (employeeRoles || []).filter(role => get(role, 'id') !== roleIdToDelete).map(role => ({
        label: get(role, 'name'),
        value: get(role, 'id'),
        key: get(role, 'id'),
    })), [roleIdToDelete, employeeRoles])

    const closeModal = useCallback(() => !loadingRef.current && setOpen(false), [])
    const openModal = useCallback(() => setOpen(true), [])

    const handleDelete = useCallback(async (formValues: { newRole?: string | null }) => {
        if (!employeeRoleToDelete || !organizationId || isMyRoleToDelete) return

        const sender = getClientSideSenderInfo()
        const meta = { dv: 1, sender }
        const newRoleId = get(formValues, 'newRole')
        const payload = {
            ...meta,
            organization: { id: organizationId },
            oldRole: { id: roleIdToDelete },
            newRole: { id: newRoleId },
            withDeletionOldRole: true,
        }

        await replaceRole({
            variables: {
                data: payload,
            },
        })
    }, [employeeRoleToDelete, roleIdToDelete, organizationId, replaceRole, isMyRoleToDelete])

    const DeleteRoleButton = useCallback((props) => {
        let tooltip
        if (isMyRoleToDelete) tooltip = MyRoleToDeleteTooltip
        if (!isEditableRole) tooltip = NotEditableRoleTooltip
        if (isDefaultRole) tooltip = DefaultRoleTooltip
        const disabledButton = !employeeRoleToDelete || !organizationId || get(props, 'disabled', false) || isMyRoleToDelete

        return (
            <Tooltip title={tooltip}>
                <div>
                    <Button
                        {...props}
                        type='secondary'
                        danger
                        onClick={openModal}
                        children={DeleteRoleLabel}
                        disabled={disabledButton}
                    />
                </div>
            </Tooltip>
        )
    }, [isMyRoleToDelete, MyRoleToDeleteTooltip, isEditableRole, NotEditableRoleTooltip, isDefaultRole, DefaultRoleTooltip, employeeRoleToDelete, organizationId, openModal, DeleteRoleLabel])

    const DeleteRoleModal = useMemo(() => (
        <FormWithAction
            action={handleDelete}
            OnCompletedMsg={null}
            resetOnComplete={false}
        >
            {({ isLoading, handleSave, form }) => {
                formRef.current = form
                loadingRef.current = isLoading
                return (
                    <Modal
                        open={isOpen}
                        title={ModalTitle}
                        onCancel={closeModal}
                        footer={[
                            <Button
                                type='secondary'
                                key='deleteRole'
                                id='deleteRole'
                                danger
                                onClick={handleSave}
                                disabled={!employeeRoleToDelete || !organizationId || isMyRoleToDelete}
                                loading={isLoading}
                                children={DeleteLabel}
                            />,
                            <Button
                                type='secondary'
                                key='cancelDeleteRole'
                                id='cancelDeleteRole'
                                onClick={closeModal}
                                disabled={isLoading}
                                children={CancelLabel}
                            />,
                        ]}
                    >
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Typography.Paragraph type='secondary'>{ModalDescription}</Typography.Paragraph>
                            </Col>
                            <Col span={24}>
                                <Form.Item
                                    label={NewRoleLabel}
                                    name='newRole'
                                    rules={[{ required: true }]}
                                    required
                                    wrapperCol={{ span: 24 }}
                                >
                                    <Select
                                        placeholder={NewRolePlaceholder}
                                        options={options}
                                        disabled={isLoading}
                                        id='selectNewRole'
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Modal>
                )
            }}
        </FormWithAction>
    ), [CancelLabel, DeleteLabel, ModalDescription, ModalTitle, NewRoleLabel, NewRolePlaceholder, closeModal, employeeRoleToDelete, handleDelete, isOpen, options, organizationId, isMyRoleToDelete])

    return useMemo(() => ({
        DeleteRoleButton,
        DeleteRoleModal,
    }), [DeleteRoleButton, DeleteRoleModal])
}

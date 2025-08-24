import {
    OrganizationEmployeeRole as IEmployeeRole,
    B2BApp as IB2BApp,
    B2BAppPermission as IB2BAppPermission,
    B2BAppRole as IB2BAppRole,
    OrganizationEmployeeRoleCreateInput as IEmployeeRoleCreateInput,
    OrganizationEmployeeRoleUpdateInput as IEmployeeRoleUpdateInput,
    QueryAllOrganizationEmployeeRolesArgs as IQueryAllEmployeeRolesArgs,
    OrganizationEmployeeRoleTicketVisibilityTypeType,
} from '@app/condo/schema'
import { Col, ColProps, Row } from 'antd'
import { FormProps } from 'antd/lib/form/Form'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { Options as ScrollOptions } from 'scroll-into-view-if-needed'

import { IGenerateHooksResult } from '@open-condo/codegen/generate.hooks'
import { useIntl } from '@open-condo/next/intl'
import {
    ActionBar,
    Button,
    Radio,
    RadioGroup,
    Space, Tooltip,
    Typography,
} from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { FormItem } from '@condo/domains/common/components/Form/FormItem'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import Prompt from '@condo/domains/common/components/Prompt'
import { TextArea } from '@condo/domains/common/components/TextArea'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { B2BAppRole } from '@condo/domains/miniapp/utils/clientSchema'
import {
    ASSIGNED_TICKET_VISIBILITY,
    ORGANIZATION_TICKET_VISIBILITY,
    PROPERTY_AND_SPECIALIZATION_VISIBILITY,
    PROPERTY_TICKET_VISIBILITY,
} from '@condo/domains/organization/constants/common'
import { MAX_ROLE_COUNT } from '@condo/domains/organization/constants/common'
import { useDeleteEmployeeRole } from '@condo/domains/organization/hooks/useDeleteEmployeeRole'
import {
    PermissionsGroup, UseEmployeeRolesPermissionsGroups,
    useEmployeeRolesPermissionsGroups as useEmployeeRolesPermissionsGroupsHook,
} from '@condo/domains/organization/hooks/useEmployeeRolesPermissionsGroups'

import { PermissionsGrid } from './PermissionsGrid'


type FormLayoutProps = Pick<FormProps, 'labelCol' | 'wrapperCol' | 'layout' | 'labelAlign'>

type FormSectionProps = {
    title?: string
    subtitle?: string
    wrapperCol?: ColProps
}

const FormSection: React.FC<React.PropsWithChildren<FormSectionProps>> = ({ title, subtitle, children, wrapperCol }) => {
    const content = (
        <Row gutter={[0, 40]}>
            {
                title && (
                    <Row gutter={[0, 16]}>
                        <Col span={24}>
                            <Typography.Title level={3}>
                                {title}
                            </Typography.Title>
                        </Col>
                        {
                            subtitle && (
                                <Col span={24}>
                                    <Typography.Text type='secondary'>
                                        {subtitle}
                                    </Typography.Text>
                                </Col>
                            )
                        }
                    </Row>
                )
            }
            <Col span={24}>
                <Row>
                    {children}
                </Row>
            </Col>
        </Row>
    )

    return wrapperCol ? <Col {...wrapperCol}>{content}</Col> : content
}

const COMMON_WRAPPER_COL = { span: 24 }
export const FORM_LAYOUT_PROPS: FormLayoutProps = {
    labelCol: {
        span: 24,
    },
    wrapperCol: {
        span: 24,
    },
    layout: 'vertical',
}
export const FORM_VALIDATE_TRIGGER = ['onSubmit']
export const SCROLL_TO_FIRST_ERROR_CONFIG: ScrollOptions = { behavior: 'smooth', block: 'center' }
const CONSTRAINT_UNIQUE_KEY = 'organization_employee_role_unique_organization_and_name'


export type EmployeeRoleFormValuesType = Partial<Pick<IEmployeeRole, 'name' | 'description' | 'ticketVisibilityType' | 'id'>> & {
    permissions: {
        organization: {
            [permissionKey: string]: boolean
        }
        b2bApps: {
            [b2bAppId: string]: {
                [permissionKey: string]: boolean
            }
        }
    }
}

type EmployeeRoleClientUtilsType = IGenerateHooksResult<IEmployeeRole, IEmployeeRoleCreateInput, IEmployeeRoleUpdateInput, IQueryAllEmployeeRolesArgs>
export type BaseEmployeeRoleFormPropsType = {
    connectedB2BApps?: Array<IB2BApp>
    b2BAppPermissions?: Array<IB2BAppPermission>
    b2bAppRoles?: Array<IB2BAppRole>
    employeeRoleToUpdate?: IEmployeeRole
    currentEmployeeRole?: Pick<IEmployeeRole, 'id'>
    createOrUpdateEmployeeRole: (values: IEmployeeRoleCreateInput | IEmployeeRoleUpdateInput) => ReturnType<ReturnType<EmployeeRoleClientUtilsType['useCreate' | 'useUpdate']>>
    employeeRoles?: Array<IEmployeeRole>
    useEmployeeRolesPermissionsGroups?: UseEmployeeRolesPermissionsGroups
    employeeRolesCount: number
}

const getInitValues = (employeeRole: Partial<IEmployeeRole> = {}, permissionsGroups: PermissionsGroup[] = [], b2bAppRoles: Array<IB2BAppRole> = []): EmployeeRoleFormValuesType => {
    let organizationPermissions: EmployeeRoleFormValuesType['permissions']['organization'] = {}
    const b2bAppsPermissions: EmployeeRoleFormValuesType['permissions']['b2bApps'] = {}

    for (const group of permissionsGroups) {
        const permissionKeys = group.permissions.map(permission => permission.key)

        if (group.b2bAppId) {
            const b2bAppRole = b2bAppRoles.find(role => get(role, 'role.id') === get(employeeRole, 'id'))
            const permissionsB2BAppRole = get(b2bAppRole, 'permissions')
            const canReadAppKey = `canRead${group.b2bAppId}`
            b2bAppsPermissions[group.b2bAppId] = permissionKeys.reduce<{ [permissionKey: string]: boolean }>((acc, key) => {
                acc[key] = key === canReadAppKey
                    ? Boolean(b2bAppRole)
                    : get(permissionsB2BAppRole, key, false)
                return acc
            }, {})
        } else {
            const permissionFromRole: EmployeeRoleFormValuesType['permissions']['organization'] = permissionKeys.reduce((acc, key) => {
                acc[key] = get(employeeRole, key, false)
                return acc
            }, {})
            organizationPermissions = {
                ...organizationPermissions,
                ...permissionFromRole,
            }
        }
    }

    return {
        name: employeeRole.name || '',
        description: employeeRole.description || '',
        ticketVisibilityType: employeeRole.ticketVisibilityType || OrganizationEmployeeRoleTicketVisibilityTypeType.Organization,
        permissions: {
            organization: organizationPermissions,
            b2bApps: b2bAppsPermissions,
        },
    }
}

export const BaseEmployeeRoleForm: React.FC<BaseEmployeeRoleFormPropsType> = ({
    b2BAppPermissions = [],
    connectedB2BApps = [],
    b2bAppRoles = [],
    employeeRoleToUpdate,
    currentEmployeeRole,
    createOrUpdateEmployeeRole,
    employeeRoles = [],
    useEmployeeRolesPermissionsGroups = useEmployeeRolesPermissionsGroupsHook,
    employeeRolesCount,
}) => {
    const intl = useIntl()
    const PromptTitle = intl.formatMessage({ id: 'form.prompt.title' })
    const PromptMessage = intl.formatMessage({ id: 'form.prompt.message' })
    const NameLabel = intl.formatMessage({ id: 'pages.condo.employeeRole.form.name.label' })
    const NamePlaceholder = intl.formatMessage({ id: 'pages.condo.employeeRole.form.name.placeholder' })
    const DescriptionLabel = intl.formatMessage({ id: 'pages.condo.employeeRole.form.description.label' })
    const DescriptionHelpMessage = intl.formatMessage({ id: 'pages.condo.employeeRole.form.description.help.message' })
    const DescriptionPlaceholder = intl.formatMessage({ id: 'pages.condo.employeeRole.form.description.placeholder' })
    const TicketVisibilitySectionTitle = intl.formatMessage({ id: 'pages.condo.employeeRole.form.ticketVisibility.title' })
    const TicketVisibilitySectionDescriptionMessage = intl.formatMessage({ id: 'pages.condo.employeeRole.form.ticketVisibility.description' })
    const OrganizationTicketVisibilityLabel = intl.formatMessage({ id: 'pages.condo.employeeRole.form.ticketVisibility.type.organization' })
    const PropertyTicketVisibilityLabel = intl.formatMessage({ id: 'pages.condo.employeeRole.form.ticketVisibility.type.property' })
    const PropertyAndSpecializationTicketVisibilityLabel = intl.formatMessage({ id: 'pages.condo.employeeRole.form.ticketVisibility.type.propertyAndSpecialization' })
    const AssignedTicketVisibilityLabel = intl.formatMessage({ id: 'pages.condo.employeeRole.form.ticketVisibility.type.assigned' })
    const PermissionsSectionTitle = intl.formatMessage({ id: 'pages.condo.employeeRole.form.permissions.title' })
    const NotEditableRoleTooltip = intl.formatMessage({ id: 'pages.condo.employeeRole.tooltip.notEditableRole' }, { role: get(employeeRoleToUpdate, 'name') })
    const RoleCreationLimitReachedTooltip = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.roleCreationLimitReachedTooltip' }, { max: MAX_ROLE_COUNT })
    const RoleNameAlreadyExistErrorMessage = intl.formatMessage({ id: 'api.organization.organizationEmployeeRole.ROLE_NAME_ALREADY_EXIST' })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })
    const SaveMessage = intl.formatMessage({ id: 'Save' })

    const router = useRouter()

    const { requiredValidator, minLengthValidator, maxLengthValidator, trimValidator } = useValidations()

    const action = employeeRoleToUpdate ? 'update' : 'create'
    const isDefaultRole = action === 'create' ? false : get(employeeRoleToUpdate, 'isDefault', true)
    const isEditableRole = action === 'create' ? true : get(employeeRoleToUpdate, 'isEditable', false)
    const roleCreationLimitReached = action === 'create' && employeeRolesCount >= MAX_ROLE_COUNT
    const saveTooltip = useMemo(() => {
        if (!isEditableRole) return NotEditableRoleTooltip
        if (roleCreationLimitReached) return RoleCreationLimitReachedTooltip
        return null
    }, [NotEditableRoleTooltip, RoleCreationLimitReachedTooltip, isEditableRole, roleCreationLimitReached])

    const permissionsGroups: PermissionsGroup[] = useEmployeeRolesPermissionsGroups(connectedB2BApps, b2BAppPermissions)
    const initialValues = useMemo(() => getInitValues(employeeRoleToUpdate, permissionsGroups, b2bAppRoles), [employeeRoleToUpdate, permissionsGroups, b2bAppRoles])

    const { DeleteRoleButton, DeleteRoleModal } = useDeleteEmployeeRole(employeeRoles, employeeRoleToUpdate, currentEmployeeRole)

    const createB2BAppRoleAction = B2BAppRole.useCreate({})
    const softDeleteB2BAppRoleAction = B2BAppRole.useSoftDelete()
    const updateB2BAppRoleAction = B2BAppRole.useUpdate({})

    const validators = useMemo(() => ({
        name: [requiredValidator, trimValidator, minLengthValidator(1), maxLengthValidator(120)],
        description: [maxLengthValidator(500)],
    }), [requiredValidator, maxLengthValidator, minLengthValidator, trimValidator])

    const handleSubmit = useCallback(async (formValues: EmployeeRoleFormValuesType) => {
        if (!isEditableRole || roleCreationLimitReached) return

        const { name, description, permissions, ticketVisibilityType } = formValues
        const newValues: EmployeeRoleFormValuesType = { name, description, permissions, ticketVisibilityType }

        if (isEqual(initialValues, newValues)) {
            return await router.push('/settings?tab=employeeRoles')
        }

        // ----------- save organization role -----------

        const organizationPermissions = get(permissions, 'organization', {})
        const initialEmployeeRole = {
            ...pick(initialValues, ['name', 'description', 'ticketVisibilityType']),
            ...get(initialValues, 'permissions.organization', {}),
        }
        const updatedEmployeeRole = {
            ...pick(newValues, ['name', 'description', 'ticketVisibilityType']),
            ...organizationPermissions,
        }
        const employeeRolePayload = isDefaultRole
            ? omit(updatedEmployeeRole, ['name', 'description', 'ticketVisibilityType'])
            : updatedEmployeeRole

        let employeeRole: IEmployeeRole
        if (isEqual(initialEmployeeRole, updatedEmployeeRole)) {
            employeeRole = employeeRoleToUpdate
        } else {
            employeeRole = await createOrUpdateEmployeeRole(employeeRolePayload)
        }

        const employeeRoleId = get(employeeRole, 'id')
        if (!employeeRoleId) return console.warn('no employeeRoleId to create/update b2b roles')

        // ----------- save b2b roles -----------

        const b2bAppsPermissionsByAppId = get(permissions, 'b2bApps', {})

        for (const [appId, newPermissions] of Object.entries(b2bAppsPermissionsByAppId)) {
            const canReadAppKey = `canRead${appId}`
            const initialPermissions = get(initialValues, ['permissions', 'b2bApps', appId])
            const b2bAppPermissionsKeys = b2BAppPermissions
                .filter(permission => get(permission, 'app.id') === appId)
                .map(permission => permission.key)

            const isCreateB2BAppRoleOperation = !get(initialPermissions, canReadAppKey) && !!get(newPermissions, canReadAppKey)
            const isDeleteB2BAppRoleOperation = !!get(initialPermissions, canReadAppKey) && !get(newPermissions, canReadAppKey)
            const isUpdateB2BAppRoleOperation = !!get(initialPermissions, canReadAppKey) && !!get(newPermissions, canReadAppKey)
            const newPermissionsToMutation = pick(newPermissions, b2bAppPermissionsKeys)
            const b2bAppRoleToMutation = b2bAppRoles.find(b2bAppRole => get(b2bAppRole, 'role.id') === employeeRoleId && get(b2bAppRole, 'app.id') === appId)

            if (isEqual(newPermissions, initialPermissions)) continue

            if (isCreateB2BAppRoleOperation) {
                await createB2BAppRoleAction({
                    app: { connect: { id: appId } },
                    role: { connect: { id: employeeRoleId } },
                    permissions: newPermissionsToMutation,
                })
            } else if (isDeleteB2BAppRoleOperation) {
                if (b2bAppRoleToMutation) {
                    await softDeleteB2BAppRoleAction(b2bAppRoleToMutation)
                } else {
                    console.warn('no b2b app role for delete')
                }
            } else if (isUpdateB2BAppRoleOperation) {
                if (b2bAppRoleToMutation) {
                    await updateB2BAppRoleAction({ permissions: newPermissionsToMutation }, b2bAppRoleToMutation)
                } else {
                    console.warn('no b2b app role for update')
                }
            } else {
                console.warn('unexpected operation for b2b app role')
            }
        }

        await router.push('/settings?tab=employeeRoles')
    }, [b2BAppPermissions, b2bAppRoles, initialValues, createOrUpdateEmployeeRole, isDefaultRole, isEditableRole, roleCreationLimitReached])

    const handleCancel = useCallback(async () => await router.push('/settings?tab=employeeRoles'), [])

    const ErrorToFormFieldMsgMapping = useMemo(() => ({
        [CONSTRAINT_UNIQUE_KEY]: {
            name: 'name',
            errors: [RoleNameAlreadyExistErrorMessage],
        },
    }), [RoleNameAlreadyExistErrorMessage])

    return (
        <Row gutter={[0, 60]}>
            <Col span={24}>
                <FormWithAction
                    initialValues={initialValues}
                    action={handleSubmit}
                    colon={false}
                    scrollToFirst={SCROLL_TO_FIRST_ERROR_CONFIG}
                    validateTrigger={FORM_VALIDATE_TRIGGER}
                    ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
                    {...FORM_LAYOUT_PROPS}
                    children={({ handleSave, isLoading, form }) => (
                        <>
                            <Prompt
                                title={PromptTitle}
                                form={form}
                                handleSave={handleSave}
                            >
                                <Typography.Paragraph>
                                    {PromptMessage}
                                </Typography.Paragraph>
                            </Prompt>
                            <Row gutter={[0, 60]}>
                                <FormSection wrapperCol={COMMON_WRAPPER_COL}>
                                    <Col span={24} lg={18} xl={13}>
                                        <Row gutter={[0, 24]}>
                                            <Col span={24}>
                                                <FormItem
                                                    label={NameLabel}
                                                    name='name'
                                                    rules={validators.name}
                                                    validateTrigger={FORM_VALIDATE_TRIGGER}
                                                    validateFirst
                                                >
                                                    <Input
                                                        maxLength={120}
                                                        placeholder={NamePlaceholder}
                                                        disabled={isDefaultRole || !isEditableRole}
                                                    />
                                                </FormItem>
                                            </Col>

                                            <Col span={24}>
                                                <FormItem
                                                    label={<LabelWithInfo title={DescriptionHelpMessage} message={DescriptionLabel} />}
                                                    name='description'
                                                    rules={validators.description}
                                                    validateTrigger={FORM_VALIDATE_TRIGGER}
                                                    validateFirst
                                                >
                                                    <TextArea
                                                        maxLength={500}
                                                        placeholder={DescriptionPlaceholder}
                                                        disabled={isDefaultRole || !isEditableRole}
                                                    />
                                                </FormItem>
                                            </Col>
                                        </Row>
                                    </Col>
                                </FormSection>
                                <FormSection
                                    title={TicketVisibilitySectionTitle}
                                    subtitle={TicketVisibilitySectionDescriptionMessage}
                                    wrapperCol={COMMON_WRAPPER_COL}
                                >
                                    <Col span={24}>
                                        <FormItem
                                            name='ticketVisibilityType'
                                        >
                                            <RadioGroup disabled={isDefaultRole || !isEditableRole}>
                                                <Space wrap direction='vertical' size={12}>
                                                    <Radio value={ORGANIZATION_TICKET_VISIBILITY} label={OrganizationTicketVisibilityLabel} disabled={isDefaultRole || !isEditableRole} />
                                                    <Radio value={PROPERTY_TICKET_VISIBILITY} label={PropertyTicketVisibilityLabel} disabled={isDefaultRole || !isEditableRole} />
                                                    <Radio value={PROPERTY_AND_SPECIALIZATION_VISIBILITY} label={PropertyAndSpecializationTicketVisibilityLabel} disabled={isDefaultRole || !isEditableRole} />
                                                    <Radio value={ASSIGNED_TICKET_VISIBILITY} label={AssignedTicketVisibilityLabel} disabled={isDefaultRole || !isEditableRole} />
                                                </Space>
                                            </RadioGroup>
                                        </FormItem>
                                    </Col>
                                </FormSection>
                                <FormSection wrapperCol={COMMON_WRAPPER_COL} title={PermissionsSectionTitle}>
                                    <Col span={24}>
                                        <PermissionsGrid
                                            form={form}
                                            permissionsGroups={permissionsGroups}
                                            initState={initialValues.permissions}
                                            disabled={!isEditableRole}
                                        />
                                    </Col>
                                </FormSection>
                                <Col span={24}>
                                    <ActionBar actions={[
                                        <Tooltip key='save' title={saveTooltip}>
                                            <span>
                                                <Button
                                                    key='saveRole'
                                                    id='saveRole'
                                                    type='primary'
                                                    children={SaveMessage}
                                                    onClick={handleSave}
                                                    loading={isLoading}
                                                    disabled={!isEditableRole || roleCreationLimitReached}
                                                />
                                            </span>
                                        </Tooltip>,
                                        <Button
                                            key='cancelRole'
                                            id='cancelRole'
                                            type='secondary'
                                            children={CancelMessage}
                                            disabled={isLoading}
                                            onClick={handleCancel}
                                        />,
                                        action === 'update' && (
                                            <DeleteRoleButton
                                                key='openDeleteRoleModal'
                                                id='openDeleteRoleModal'
                                                disabled={isLoading || !isEditableRole || isDefaultRole}
                                            />
                                        ),
                                    ]} />
                                </Col>
                            </Row>
                        </>
                    )}
                />
            </Col>
            {
                action === 'update' && (
                    DeleteRoleModal
                )
            }
            <Col span={24} style={{ height: '100px' }} />
        </Row>
    )
}

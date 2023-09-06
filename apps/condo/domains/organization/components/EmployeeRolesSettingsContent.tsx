import {
    B2BApp,
    B2BAppRoleCreateInput,
    B2BAppRoleUpdateInput,
    SortOrganizationEmployeeRolesBy,
    OrganizationEmployeeRole as OrganizationEmployeeRoleType,
    B2BAppPermission as B2BAppPermissionType,
    B2BAppRole as B2BAppRoleType,
} from '@app/condo/schema'
import { Col, notification, Row, RowProps, Typography } from 'antd'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import set from 'lodash/set'
import uniqBy from 'lodash/uniqBy'
import { TableComponents } from 'rc-table/lib/interface'
import React, {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'

import {
    IUseCreateActionType,
    IUseSoftDeleteActionType, IUseUpdateActionType,
} from '@open-condo/codegen/generate.hooks'
import { Close } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, ActionBarProps, Button, Checkbox, Tooltip } from '@open-condo/ui'

import {
    EXPANDABLE_COLUMN_STUB,
    ExpandableTable,
    Table,
    TableRecord,
} from '@condo/domains/common/components/Table/Index'
import { B2BAppPermission, B2BAppRole } from '@condo/domains/miniapp/utils/clientSchema'
import {
    GROUP_NAME_COLUMN_WIDTH,
    ROLE_COLUMN_STYLE,
    useEmployeeRolesTableColumns,
    useEmployeeRoleTicketVisibilityInfoTableColumns,
} from '@condo/domains/organization/hooks/useEmployeeRolesTableColumns'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'


const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]

type PermissionRow = {
    id: string,
    key: string,
    name: string,
}

type PermissionsGroup = {
    id: string,
    groupName: string
    permissions: PermissionRow[],
}

type EmployeeRolesTableProps = {
    connectedB2BApps: B2BApp[],
    employeeRoles: OrganizationEmployeeRoleType[],
    b2BAppRoles: B2BAppRoleType[],
    b2BAppPermissions: B2BAppPermissionType[],
    loading: boolean,
    createB2BAppRoleAction: IUseCreateActionType<B2BAppRoleType, B2BAppRoleCreateInput>,
    softDeleteB2BAppRoleAction: IUseSoftDeleteActionType<B2BAppRoleType>,
    updateB2BAppRoleAction: IUseUpdateActionType<B2BAppRoleType, B2BAppRoleUpdateInput>,
}

type PermissionsType = { [permissionKey: string]: boolean }

type PermissionState = {
    [roleId: string]: {
        organizationPermissions: PermissionsType,
        b2bAppRoles: {
            [b2bAppId: string]: {
                roleId: string,
                permissions: PermissionsType
            }
        }
    }
}

type TableCheckboxProps = {
    employeeRoleId: string
    b2bAppId?: string
    permissionKey: string
    permissionState: PermissionState
    setPermissionState: Dispatch<SetStateAction<PermissionState>>
}

type SaveNotificationType = 'create' | 'delete'

const getPermissionsWithNewValue = ({ permissionKey, newValue, oldPermissions, isReadPermission }) => {
    let newPermissions

    if (isReadPermission) {
        if (newValue) {
            newPermissions = { ...oldPermissions, [permissionKey]: newValue }
        } else if (!newValue) {
            newPermissions = Object.keys(oldPermissions)
                .reduce((acc, permission) => ({ ...acc, [permission]: false }), {})
        }
    } else {
        if (newValue) {
            const readPermissionKey = Object.keys(oldPermissions).find(permission => permission.startsWith('canRead'))
            newPermissions = { ...oldPermissions, [permissionKey]: newValue, [readPermissionKey]: true }
        } else {
            newPermissions = { ...oldPermissions, [permissionKey]: newValue }
        }
    }

    return newPermissions
}

const isCheckboxDisabled = ({ checkboxValue, employeeRoleId, permissionKey, isReadPermission, permissionState, pathToPermissionsGroup }) => {
    const otherEmployeeRoleIds = Object.keys(omit(permissionState, employeeRoleId))
    const pathToPermissionsGroupFromEmployeeRole = pathToPermissionsGroup.slice(1)
    let checkboxDisabled = checkboxValue

    for (const roleId of otherEmployeeRoleIds) {
        const isOtherEmployeeHasPermission = get(permissionState, [roleId, ...pathToPermissionsGroupFromEmployeeRole, permissionKey], false)

        if (isOtherEmployeeHasPermission) {
            checkboxDisabled = false
            break
        }
    }

    if (isReadPermission) {
        const permissionsGroup = get(permissionState, pathToPermissionsGroup)
        checkboxDisabled = false

        for (const permission of Object.keys(permissionsGroup)) {
            let otherEmployeeHasPermission = false

            for (const roleId of otherEmployeeRoleIds) {
                const isEmployeeHasPermission = get(permissionState, [roleId, ...pathToPermissionsGroupFromEmployeeRole, permission], false)

                if (isEmployeeHasPermission) {
                    otherEmployeeHasPermission = true
                    break
                }
            }

            checkboxDisabled = !otherEmployeeHasPermission
        }
    }

    return checkboxDisabled
}

const getSaveNotificationType = ({ initialPermissionState, permissionState }): SaveNotificationType => {
    let notificationType: SaveNotificationType = 'delete'

    for (const roleId of Object.keys(initialPermissionState)) {
        const initialAppsPermissions = initialPermissionState[roleId].b2bAppRoles
        const newAppsPermissions = permissionState[roleId].b2bAppRoles

        for (const appId of Object.keys(initialAppsPermissions)) {
            const initialAppPermissions = initialAppsPermissions[appId].permissions
            const newAppPermissions = newAppsPermissions[appId].permissions

            for (const permission of Object.keys(initialAppPermissions)) {
                if (!initialAppPermissions[permission] && newAppPermissions[permission]) {
                    notificationType = 'create'
                }
            }
        }
    }

    return notificationType
}

const updateB2BAppRolePermissions = async ({
    employeeRoleId,
    initialB2bRolePermissions,
    newB2bRolePermissions,
    b2BAppPermissions,
    b2BAppRoles,
    createB2BAppRoleAction,
    softDeleteB2BAppRoleAction,
    updateB2BAppRoleAction,
}) => {
    for (const appId of Object.keys(newB2bRolePermissions)) {
        const initialEmployeePermissionsInB2BApp = initialB2bRolePermissions[appId]
        const newEmployeePermissionsInB2BApp = newB2bRolePermissions[appId]

        if (!isEqual(initialEmployeePermissionsInB2BApp, newEmployeePermissionsInB2BApp)) {
            const canReadAppKey = `canRead${appId}`
            const initialPermissions = initialEmployeePermissionsInB2BApp.permissions
            const newPermissions = newEmployeePermissionsInB2BApp.permissions
            const b2bAppPermissionsKeys = b2BAppPermissions
                .filter(permission => permission.app.id === appId)
                .map(permission => permission.key)

            const isCreateB2BAppRoleOperation = !initialPermissions[canReadAppKey] && newPermissions[canReadAppKey]
            const isDeleteB2BAppRoleOperation = initialPermissions[canReadAppKey] && !newPermissions[canReadAppKey]
            const isUpdateB2BAppRoleOperation = initialPermissions[canReadAppKey] && newPermissions[canReadAppKey]
            const newPermissionsToMutations = pick(newPermissions, b2bAppPermissionsKeys)

            if (isCreateB2BAppRoleOperation) {
                const permissionsToCreateAction = pick(newPermissions, b2bAppPermissionsKeys)

                await createB2BAppRoleAction({
                    app: { connect: { id: appId } },
                    role: { connect: { id: employeeRoleId } },
                    permissions: permissionsToCreateAction,
                })
            } else if (isDeleteB2BAppRoleOperation) {
                const b2bAppRoleToDelete = b2BAppRoles
                    .find(role => role.id === initialEmployeePermissionsInB2BApp.roleId)

                await softDeleteB2BAppRoleAction(b2bAppRoleToDelete)
            } else if (isUpdateB2BAppRoleOperation) {
                const b2bAppRoleToUpdate = b2BAppRoles
                    .find(role => role.id === initialEmployeePermissionsInB2BApp.roleId)

                await updateB2BAppRoleAction({
                    permissions: newPermissionsToMutations,
                }, b2bAppRoleToUpdate)
            }
        }
    }
}

const TableCheckbox: React.FC<TableCheckboxProps> = ({ employeeRoleId, b2bAppId, permissionKey, permissionState, setPermissionState }) => {
    const intl = useIntl()
    const DisabledTooltipTitle = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.disabledCheckboxTitle' })

    let value
    let pathToPermissionsGroup
    const isReadPermission = permissionKey.startsWith('canRead')
    const isB2bPermission = !!b2bAppId

    if (isB2bPermission) {
        pathToPermissionsGroup = [employeeRoleId, 'b2bAppRoles', b2bAppId, 'permissions']
        value = get(permissionState, [...pathToPermissionsGroup, permissionKey], false)
    } else {
        pathToPermissionsGroup = [employeeRoleId, 'organizationPermissions']
        value = get(permissionState, [...pathToPermissionsGroup, permissionKey], false)
    }

    const onChange = useCallback((e) => {
        const newValue = e.target.checked
        const newState = cloneDeep(permissionState)
        const oldPermissions = get(newState, pathToPermissionsGroup)
        const newPermissions = getPermissionsWithNewValue({
            permissionKey,
            newValue,
            oldPermissions,
            isReadPermission,
        })

        set(newState, pathToPermissionsGroup, newPermissions)
        setPermissionState(newState)
    }, [isReadPermission, pathToPermissionsGroup, permissionKey, permissionState, setPermissionState])

    const checkboxDisabled = isCheckboxDisabled({
        checkboxValue: value,
        employeeRoleId,
        permissionKey,
        isReadPermission,
        permissionState,
        pathToPermissionsGroup,
    })

    return (
        <div style={ROLE_COLUMN_STYLE}>
            {
                checkboxDisabled ? (
                    <Tooltip title={DisabledTooltipTitle}>
                        <Checkbox checked={Boolean(value)} onChange={onChange} disabled={true} />
                    </Tooltip>
                ) : (
                    <Checkbox checked={Boolean(value)} onChange={onChange} />
                )
            }
        </div>
    )
}

const ExpandableRow = ({ permissionsGroup, employeeRoles, permissionState, setPermissionState }) => {
    const permissionRows = permissionsGroup.permissions

    const columns = useMemo(() => [
        {
            dataIndex: 'name',
            width: GROUP_NAME_COLUMN_WIDTH,
        },
        ...employeeRoles.map(employeeRole => ({
            render: (permissionRow: PermissionRow) => {
                return <TableCheckbox
                    b2bAppId={permissionsGroup.id}
                    permissionKey={permissionRow.key}
                    employeeRoleId={employeeRole.id}
                    permissionState={permissionState}
                    setPermissionState={setPermissionState}
                />
            },
        })),
        EXPANDABLE_COLUMN_STUB,
    ], [employeeRoles, permissionState, permissionsGroup.id, setPermissionState])

    return <Table
        tableLayout='auto'
        rowClassName='inner-table-row'
        showHeader={false}
        pagination={false}
        dataSource={permissionRows}
        columns={columns}
    />
}

export const EmployeeRolesTable: React.FC<EmployeeRolesTableProps> = ({
    connectedB2BApps, employeeRoles, b2BAppRoles, b2BAppPermissions,
    loading, softDeleteB2BAppRoleAction, updateB2BAppRoleAction, createB2BAppRoleAction,
}) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'EmployeeRoles' })
    const CanReadServiceTitle = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.canReadService' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const CancelSelectionLabel = intl.formatMessage({ id: 'global.cancelSelection' })
    const UpdatePermissionsMessage = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.notification.updatePermissions' })
    const DeletePermissionsMessage = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.notification.deletePermissions' })

    const tableColumns = useEmployeeRolesTableColumns(employeeRoles)
    const tableData: PermissionsGroup[] = useMemo(() => connectedB2BApps.map((b2bApp): PermissionsGroup => ({
        id: b2bApp.id,
        groupName: b2bApp.name,
        permissions: [
            {
                id: `canRead${b2bApp.id}`,
                key: `canRead${b2bApp.id}`,
                name: CanReadServiceTitle,
            },
            ...b2BAppPermissions
                .filter(permission => permission.app.id === b2bApp.id)
                .map((permission): PermissionRow => ({
                    id: permission.id,
                    key: permission.key,
                    name: permission.name,
                })),
        ],
    })), [CanReadServiceTitle, b2BAppPermissions, connectedB2BApps])

    const [initialPermissionState, setInitialPermissionState] = useState<PermissionState>()
    const [permissionState, setPermissionState] = useState<PermissionState>()
    const [submitActionProcessing, setSubmitActionProcessing] = useState<boolean>(false)
    const loadingState = loading || submitActionProcessing

    useEffect(() => {
        if (!loadingState) {
            setInitialPermissionState(employeeRoles.reduce(
                (acc, employeeRole) => {
                    const organizationPermissionsToPick = Object.keys(employeeRole).filter(key => key.startsWith('can'))

                    return {
                        ...acc, [employeeRole.id]: {
                            organizationPermissions: pick(employeeRole, organizationPermissionsToPick),
                            b2bAppRoles: connectedB2BApps.reduce((acc, b2bApp) => {
                                const b2bRole = b2BAppRoles.find(b2bAppRole =>
                                    get(b2bAppRole, 'role.id') === employeeRole.id && get(b2bAppRole, 'app.id') === b2bApp.id)

                                if (b2bRole) {
                                    return {
                                        ...acc,
                                        [b2bApp.id]: {
                                            roleId: b2bRole.id,
                                            permissions: { ...b2bRole.permissions, [`canRead${b2bApp.id}`]: true },
                                        },
                                    }
                                }

                                return {
                                    ...acc,
                                    [b2bApp.id]: {
                                        permissions: {
                                            ...b2BAppPermissions
                                                .filter(permission => permission.app.id === b2bApp.id)
                                                .reduce((acc, permission) => ({ ...acc, [permission.key]: false }), {}),
                                            [`canRead${b2bApp.id}`]: false,
                                        },
                                    },
                                }
                            }, {}),
                        },
                    }
                }
                , {}))
        }
    }, [b2BAppPermissions, b2BAppRoles, connectedB2BApps, employeeRoles, loadingState])

    useEffect(() => {
        if (!loadingState) {
            setPermissionState(cloneDeep(initialPermissionState))
        }
    }, [initialPermissionState, loadingState])

    const handleCancel = useCallback(() => {
        setPermissionState(cloneDeep(initialPermissionState))
    }, [initialPermissionState])

    const handleSave = useCallback(async () => {
        setSubmitActionProcessing(true)

        for (const employeeRole of employeeRoles) {
            const employeeRoleId = employeeRole.id
            const initialRolePermissions = initialPermissionState[employeeRoleId]
            const newRolePermissions = permissionState[employeeRoleId]

            if (isEqual(initialRolePermissions, newRolePermissions)) {
                continue
            }

            const initialB2bRolePermissions = initialRolePermissions.b2bAppRoles
            const newB2bRolePermissions = newRolePermissions.b2bAppRoles

            if (!isEqual(initialB2bRolePermissions, newB2bRolePermissions)) {
                await updateB2BAppRolePermissions({
                    employeeRoleId,
                    initialB2bRolePermissions,
                    newB2bRolePermissions,
                    b2BAppPermissions,
                    b2BAppRoles,
                    createB2BAppRoleAction,
                    updateB2BAppRoleAction,
                    softDeleteB2BAppRoleAction,
                })
            }
        }

        const notificationType = getSaveNotificationType({
            initialPermissionState,
            permissionState,
        })

        notification.info({
            message: notificationType === 'delete' ? DeletePermissionsMessage : UpdatePermissionsMessage,
        })
        
        setInitialPermissionState(cloneDeep(permissionState))
        setSubmitActionProcessing(false)
    }, [
        DeletePermissionsMessage, UpdatePermissionsMessage, b2BAppPermissions, b2BAppRoles, createB2BAppRoleAction,
        employeeRoles, initialPermissionState, permissionState, softDeleteB2BAppRoleAction, updateB2BAppRoleAction,
    ])

    const getExpandedRowRender = useCallback((permissionsGroup: PermissionsGroup) => <ExpandableRow
        permissionState={permissionState}
        employeeRoles={employeeRoles}
        setPermissionState={setPermissionState}
        permissionsGroup={permissionsGroup}
    />, [employeeRoles, permissionState])

    const expandableConfig = useMemo(() => ({
        expandedRowRender: getExpandedRowRender,
    }), [getExpandedRowRender])

    const actionBarItems: ActionBarProps['actions'] = useMemo(() => [
        <Button
            key='submit'
            onClick={handleSave}
            type='primary'
            loading={submitActionProcessing}
        >
            {SaveLabel}
        </Button>,
        <Button
            icon={<Close size='medium' />}
            key='close'
            onClick={handleCancel}
            type='secondary'
            disabled={submitActionProcessing}
        >
            {CancelSelectionLabel}
        </Button>,
    ], [CancelSelectionLabel, SaveLabel, handleCancel, handleSave, submitActionProcessing])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{TitleMessage}</Typography.Title>
            </Col>
            <Col span={24}>
                <ExpandableTable
                    loading={loading}
                    pagination={false}
                    totalRows={connectedB2BApps.length}
                    dataSource={tableData}
                    columns={tableColumns}
                    data-cy='employeeRoles__table'
                    expandable={expandableConfig}
                />
            </Col>
            <ActionBar
                actions={actionBarItems}
            />
        </Row>
    )
}

export const EmployeeRolesSettingsContent = () => {
    const userOrganization = useOrganization()
    const userOrganizationId = useMemo(() => get(userOrganization, ['organization', 'id']), [userOrganization])

    const {
        loading: isEmployeeRolesLoading,
        objs: employeeRoles,
    } = OrganizationEmployeeRole.useObjects({
        where: { organization: { id: userOrganizationId } },
        sortBy: [SortOrganizationEmployeeRolesBy.NameAsc],
    })

    const {
        loading: isB2BAppRolesLoading,
        objs: b2BAppRoles,
        refetch: refetchB2BAppRoles,
    } = B2BAppRole.useObjects({
        where: { role: { id_in: employeeRoles.map(role => role.id) } },
    })

    const createB2BAppRoleAction = B2BAppRole.useCreate({}, () => refetchB2BAppRoles())
    const softDeleteB2BAppRoleAction = B2BAppRole.useSoftDelete(() => refetchB2BAppRoles())
    const updateB2BAppRoleAction = B2BAppRole.useUpdate({}, () => refetchB2BAppRoles())

    const connectedB2BApps = uniqBy(b2BAppRoles.map(b2BAppRole => get(b2BAppRole, 'app')), 'id')

    const {
        loading: isB2BAppPermissionsLoading,
        objs: b2BAppPermissions,
    } = B2BAppPermission.useObjects({
        where: { app: { id_in: connectedB2BApps.map(b2bApp => get(b2bApp, 'id')) } },
    })

    const loading = isEmployeeRolesLoading || isB2BAppRolesLoading || isB2BAppPermissionsLoading

    return <EmployeeRolesTable
        loading={loading}
        createB2BAppRoleAction={createB2BAppRoleAction}
        softDeleteB2BAppRoleAction={softDeleteB2BAppRoleAction}
        updateB2BAppRoleAction={updateB2BAppRoleAction}
        connectedB2BApps={connectedB2BApps}
        employeeRoles={employeeRoles}
        b2BAppRoles={b2BAppRoles}
        b2BAppPermissions={b2BAppPermissions}
    />
}

export const EmployeeRoleTicketVisibilityInfo = () => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'EmployeeRoles' })
    const EditProhibitedMessage = intl.formatMessage({ id: 'EditProhibited' })

    const userOrganization = useOrganization()
    const userOrganizationId = useMemo(() => get(userOrganization, ['organization', 'id']), [userOrganization])

    const {
        loading: isRolesLoading,
        count: totalRoles,
        objs: roles,
    } = OrganizationEmployeeRole.useObjects({
        where: { organization: { id: userOrganizationId } },
    })

    const tableColumns = useEmployeeRoleTicketVisibilityInfoTableColumns([])

    const tableComponents: TableComponents<TableRecord> = useMemo(() => ({
        body: {
            row: (props) => (
                <Tooltip title={EditProhibitedMessage}>
                    <tr {...props} />
                </Tooltip>
            ),
        },
    }), [EditProhibitedMessage])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{TitleMessage}</Typography.Title>
            </Col>
            <Col span={24}>
                <Table
                    pagination={false}
                    totalRows={totalRoles}
                    loading={isRolesLoading}
                    dataSource={roles}
                    columns={tableColumns}
                    data-cy='employeeRoles__table'
                    components={tableComponents}
                />
            </Col>
        </Row>
    )
}

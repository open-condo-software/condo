import {
    B2BApp,
    B2BAppRoleCreateInput,
    B2BAppRoleUpdateInput,
    SortOrganizationEmployeeRolesBy,
    OrganizationEmployeeRole as OrganizationEmployeeRoleType,
    B2BAppPermission as B2BAppPermissionType,
    B2BAppRole as B2BAppRoleType, OrganizationEmployeeRoleUpdateInput,
} from '@app/condo/schema'
import { Col, notification, Row, RowProps } from 'antd'
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
import { ActionBar, ActionBarProps, Button, Checkbox, Tooltip, Typography } from '@open-condo/ui'

import {
    EXPANDABLE_COLUMN_STUB,
    ExpandableTable,
    Table,
    TableRecord,
} from '@condo/domains/common/components/Table/Index'
import { B2BAppContext, B2BAppPermission, B2BAppRole } from '@condo/domains/miniapp/utils/clientSchema'
import {
    GROUP_NAME_COLUMN_WIDTH,
    ROLE_COLUMN_STYLE,
    useEmployeeRolesTableColumns,
    useEmployeeRoleTicketVisibilityInfoTableColumns,
} from '@condo/domains/organization/hooks/useEmployeeRolesTableColumns'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'


const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 40]

type PermissionRow = {
    key: string,
    name: string,
    relatedCheckPermissions?: string[],
    relatedUncheckPermissions?: string[]
}

type PermissionsGroup = {
    key: string,
    b2bAppId?: string,
    groupName: string,
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
    updateOrganizationEmployeeRoleAction: IUseUpdateActionType<OrganizationEmployeeRoleType, OrganizationEmployeeRoleUpdateInput>
}

type PermissionsType = { [permissionKey: string]: boolean }

type B2BAppPermissionsState = {
    roleId?: string,
    permissions: PermissionsType
}

type PermissionsState = {
    [roleId: string]: {
        organizationPermissions: PermissionsType,
        b2bAppRoles: {
            [b2bAppId: string]: B2BAppPermissionsState
        }
    }
}

type TableCheckboxProps = {
    employeeRoleId: string
    permissionsGroup: PermissionsGroup
    permissionRow: PermissionRow
    permissionsState: PermissionsState
    setPermissionsState: Dispatch<SetStateAction<PermissionsState>>
}

/**
 * Generates b2b role permissions data for settings table.
 */
const getB2BRolePermissionGroups = (intl, connectedB2BApps, b2BAppPermissions): PermissionsGroup[] => {
    const CanReadServiceTitle = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.canReadService' })

    return connectedB2BApps.map((b2bApp): PermissionsGroup => {
        const canReadKey = `canRead${b2bApp.id}`
        const appPermissions = b2BAppPermissions.filter(permission => permission.app.id === b2bApp.id)
        const appPermissionKeys = appPermissions.map(({ key }) => key)

        return {
            key: b2bApp.id,
            b2bAppId: b2bApp.id,
            groupName: b2bApp.name,
            permissions: [
                // Client side mark that employee role has b2bRole (Due to our logic this employee role can read b2bApp).
                {
                    key: `canRead${b2bApp.id}`,
                    name: CanReadServiceTitle,
                    relatedUncheckPermissions: appPermissionKeys,
                },
                ...appPermissions
                    .map((permission): PermissionRow => ({
                        key: permission.key,
                        name: permission.name,
                        relatedCheckPermissions: [canReadKey],
                    })),
            ],
        }
    })
}

/**
 * Changes value of the checkbox and related checkboxes.
 * If user set "canManage" permission checkbox, then "canRead" checkbox sets to true automatically.
 * If user unset "canRead" permission checkbox, then all "canManage" checkboxes of this group sets to false automatically.
 */
const getPermissionsWithNewValue = ({
    relatedPermissions = [],
    permissionKey,
    newValue,
    oldPermissions,
}): PermissionsType => {
    return {
        ...oldPermissions,
        [permissionKey]: newValue,
        ...relatedPermissions.reduce((acc, key) => {
            acc[key] = newValue

            return acc
        }, {}),
    }
}

/**
 * Checks that certain checked checkbox in table is disabled.
 * If there are no one of the other employee roles who have that permission, then checkbox will be disabled.
 * If it's "canRead" checkbox, then also checks such logic for "canManage" permissions of this group.
 */
const isCheckboxDisabled = ({
    checkboxValue,
    employeeRoleId,
    permissionKey,
    permissionsState,
    pathToPermissionsGroupInState,
    relatedUncheckPermissions = [],
}) => {
    if (!checkboxValue) return false

    const otherEmployeeRoleIds = Object.keys(omit(permissionsState, employeeRoleId))
    const pathToPermissionsGroupInStateFromEmployeeRole = pathToPermissionsGroupInState.slice(1)

    // Check that at least one of other roles has checkbox.
    for (const permission of [permissionKey, ...relatedUncheckPermissions]) {
        let atLeastOneEmployeeHasPermission = false

        for (const roleId of otherEmployeeRoleIds) {
            const isOtherEmployeeHasPermission = get(
                permissionsState,
                [roleId, ...pathToPermissionsGroupInStateFromEmployeeRole, permission],
                false
            )

            if (isOtherEmployeeHasPermission) {
                atLeastOneEmployeeHasPermission = true
                break
            }
        }

        if (!atLeastOneEmployeeHasPermission) {
            return true
        }
    }

    return false
}

/**
 * Returns a message notifying that the role update is complete.
 * If there is only a checkbox withdrawal (removal of permissions), then there will be a DeletePermissionsMessage message,
 * in another case (adding permissions/adding and deleting permissions) will be a UpdatePermissionsMessage message.
 */
const getSaveNotificationMessage = ({ intl, initialPermissionsState, permissionsState }): string => {
    const UpdatePermissionsMessage = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.notification.updatePermissions' })
    const DeletePermissionsMessage = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.notification.deletePermissions' })

    let notificationMessage = DeletePermissionsMessage

    const hasAddPermissionOperation = (initialPermissions, newPermissions) => {
        for (const permission of Object.keys(initialPermissions)) {
            if (!initialPermissions[permission] && newPermissions[permission]) {
                return true
            }
        }

        return false
    }

    for (const roleId of Object.keys(initialPermissionsState)) {
        const initialEmployeeRolePermissions = initialPermissionsState[roleId].organizationPermissions
        const newEmployeeRolePermissions = permissionsState[roleId].organizationPermissions

        if (hasAddPermissionOperation(initialEmployeeRolePermissions, newEmployeeRolePermissions)) {
            notificationMessage = UpdatePermissionsMessage
        }

        const initialAppsPermissions = initialPermissionsState[roleId].b2bAppRoles
        const newAppsPermissions = permissionsState[roleId].b2bAppRoles

        for (const appId of Object.keys(initialAppsPermissions)) {
            const initialAppPermissions = initialAppsPermissions[appId].permissions
            const newAppPermissions = newAppsPermissions[appId].permissions

            if (hasAddPermissionOperation(initialAppPermissions, newAppPermissions)) {
                notificationMessage = UpdatePermissionsMessage
            }
        }
    }

    return notificationMessage
}

/**
 * Updates B2BAppRole objects according table checkboxes.
 * If user removed "canReadApp" checkbox, then B2BAppRole will be deleted.
 * If user added "canReadApp" checkbox, then B2BAppRole will be created.
 */
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

/**
 * Creates b2bApp permissions state for employee role.
 * If employee role hasn't b2bAppRole, then all b2bApp permissions will be false, otherwise as in b2bAppRole.permissions.
 * ("canRead" permission it's a client side mark that employee role has b2bAppRole)
 */
const createInitialB2BAppPermissionsState = ({ appId, b2BAppPermissions, b2bRole }): B2BAppPermissionsState => {
    if (b2bRole) {
        return {
            roleId: b2bRole.id,
            permissions: { ...b2bRole.permissions, [`canRead${appId}`]: true },
        }
    }

    return {
        permissions: {
            ...b2BAppPermissions
                .filter(permission => permission.app.id === appId)
                .reduce((acc, permission) => ({ ...acc, [permission.key]: false }), {}),
            [`canRead${appId}`]: false,
        },
    }
}

const TableCheckbox: React.FC<TableCheckboxProps> = ({
    employeeRoleId,
    permissionRow,
    permissionsState,
    setPermissionsState,
    permissionsGroup,
}) => {
    const intl = useIntl()
    const DisabledTooltipTitle = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.disabledCheckboxTitle' })

    let value
    let pathToPermissionsGroupInState
    const b2bAppId = permissionsGroup.b2bAppId
    const permissionKey = permissionRow.key
    const isB2bPermission = !!b2bAppId
    const relatedCheckPermissions = permissionRow.relatedCheckPermissions
    const relatedUncheckPermissions = permissionRow.relatedUncheckPermissions

    if (isB2bPermission) {
        pathToPermissionsGroupInState = [employeeRoleId, 'b2bAppRoles', b2bAppId, 'permissions']
        value = get(permissionsState, [...pathToPermissionsGroupInState, permissionKey], false)
    } else {
        pathToPermissionsGroupInState = [employeeRoleId, 'organizationPermissions']
        value = get(permissionsState, [...pathToPermissionsGroupInState, permissionKey], false)
    }

    const onChange = useCallback((e) => {
        const newValue = e.target.checked
        const newState = cloneDeep(permissionsState)
        const oldPermissions = get(newState, pathToPermissionsGroupInState)
        const newPermissions = getPermissionsWithNewValue({
            permissionKey,
            newValue,
            oldPermissions,
            relatedPermissions: newValue ? relatedCheckPermissions : relatedUncheckPermissions,
        })

        set(newState, pathToPermissionsGroupInState, newPermissions)
        setPermissionsState(newState)
    }, [pathToPermissionsGroupInState, permissionKey, permissionsState, relatedCheckPermissions, relatedUncheckPermissions, setPermissionsState])

    const checkboxDisabled = isCheckboxDisabled({
        checkboxValue: value,
        employeeRoleId,
        permissionKey,
        permissionsState,
        pathToPermissionsGroupInState,
        relatedUncheckPermissions,
    })

    return (
        <div style={ROLE_COLUMN_STYLE}>
            {
                checkboxDisabled ? (
                    <Tooltip title={DisabledTooltipTitle}>
                        <Checkbox checked={Boolean(value)} onChange={onChange} disabled />
                    </Tooltip>
                ) : (
                    <Checkbox checked={Boolean(value)} onChange={onChange} />
                )
            }
        </div>
    )
}

const ExpandableRow = ({ permissionsGroup, employeeRoles, permissionsState, setPermissionsState }) => {
    const permissionRows = permissionsGroup.permissions

    const columns = useMemo(() => [
        {
            dataIndex: 'name',
            width: GROUP_NAME_COLUMN_WIDTH,
        },
        ...employeeRoles.map(employeeRole => ({
            render: (permissionRow: PermissionRow) => {
                return <TableCheckbox
                    employeeRoleId={employeeRole.id}
                    permissionsGroup={permissionsGroup}
                    permissionRow={permissionRow}
                    permissionsState={permissionsState}
                    setPermissionsState={setPermissionsState}
                />
            },
        })),
        EXPANDABLE_COLUMN_STUB,
    ], [employeeRoles, permissionsGroup, permissionsState, setPermissionsState])

    return <Table
        tableLayout='auto'
        rowClassName='inner-table-row'
        showHeader={false}
        pagination={false}
        dataSource={permissionRows}
        columns={columns}
        rowKey='key'
    />
}

export const EmployeeRolesTable: React.FC<EmployeeRolesTableProps> = ({
    connectedB2BApps, employeeRoles, b2BAppRoles, b2BAppPermissions,
    loading, softDeleteB2BAppRoleAction, updateB2BAppRoleAction, createB2BAppRoleAction,
    updateOrganizationEmployeeRoleAction,
}) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'EmployeeRoles' })
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const CancelSelectionLabel = intl.formatMessage({ id: 'global.cancelSelection' })
    const ServicesGroupName = intl.formatMessage({ id: 'global.section.miniapps' })
    const CanManageB2BAppsName = intl.formatMessage({ id: 'pages.condo.settings.employeeRoles.canManageB2BApps' })

    const tableColumns = useEmployeeRolesTableColumns(employeeRoles)

    const employeeRolePermissionGroups: PermissionsGroup[] = useMemo(() => [
        {
            groupName: 'Аналитика',
            key: 'analytics',
            permissions: [
                { key: 'canReadAnalytics', name: 'Просмотр аналитики' },
            ],
        },
        {
            groupName: ServicesGroupName,
            key: 'services',
            permissions: [
                { key: 'canManageB2BApps', name: CanManageB2BAppsName },
            ],
        },
    ], [CanManageB2BAppsName, ServicesGroupName])

    const tableData: PermissionsGroup[] = useMemo(() => [
        ...employeeRolePermissionGroups,
        ...getB2BRolePermissionGroups(intl, connectedB2BApps, b2BAppPermissions),
    ], [b2BAppPermissions, connectedB2BApps, employeeRolePermissionGroups, intl])

    const [initialPermissionsState, setInitialPermissionsState] = useState<PermissionsState>()
    const [permissionsState, setPermissionsState] = useState<PermissionsState>()
    const [submitActionProcessing, setSubmitActionProcessing] = useState<boolean>(false)
    const loadingState = loading || submitActionProcessing

    useEffect(() => {
        if (!loadingState) {
            setInitialPermissionsState(employeeRoles.reduce(
                (acc, employeeRole) => {
                    const organizationPermissionsToPick = Object.keys(employeeRole).filter(key => key.startsWith('can'))

                    return {
                        ...acc,
                        [employeeRole.id]: {
                            organizationPermissions: pick(employeeRole, organizationPermissionsToPick),
                            b2bAppRoles: connectedB2BApps.reduce((acc, b2bApp) => {
                                const appId = b2bApp.id
                                const b2bRole = b2BAppRoles.find(b2bAppRole =>
                                    get(b2bAppRole, 'role.id') === employeeRole.id && get(b2bAppRole, 'app.id') === b2bApp.id)

                                return {
                                    ...acc,
                                    [b2bApp.id]: createInitialB2BAppPermissionsState({ appId, b2BAppPermissions, b2bRole }),
                                }
                            }, {}),
                        },
                    }
                }, {}))
        }
    }, [b2BAppPermissions, b2BAppRoles, connectedB2BApps, employeeRoles, loadingState])

    useEffect(() => {
        if (!loadingState) {
            setPermissionsState(cloneDeep(initialPermissionsState))
        }
    }, [initialPermissionsState, loadingState])

    const handleCancel = useCallback(() => {
        setPermissionsState(cloneDeep(initialPermissionsState))
    }, [initialPermissionsState])

    const handleSave = useCallback(async () => {
        let isPermissionsChanged
        setSubmitActionProcessing(true)

        for (const employeeRole of employeeRoles) {
            const employeeRoleId = employeeRole.id
            const initialRolePermissions = initialPermissionsState[employeeRoleId]
            const newRolePermissions = permissionsState[employeeRoleId]

            if (isEqual(initialRolePermissions, newRolePermissions)) {
                continue
            }
            isPermissionsChanged = true

            const initialEmployeeRolePermissions = initialRolePermissions.organizationPermissions
            const newEmployeeRolePermissions = newRolePermissions.organizationPermissions

            if (!isEqual(initialEmployeeRolePermissions, newEmployeeRolePermissions)) {
                await updateOrganizationEmployeeRoleAction(newEmployeeRolePermissions, employeeRole)
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

        if (isPermissionsChanged) {
            notification.info({
                message: getSaveNotificationMessage({
                    initialPermissionsState,
                    permissionsState,
                    intl,
                }),
            })
        }
        
        setInitialPermissionsState(cloneDeep(permissionsState))
        setSubmitActionProcessing(false)
    }, [
        b2BAppPermissions, b2BAppRoles, createB2BAppRoleAction, employeeRoles, initialPermissionsState,
        intl, permissionsState, softDeleteB2BAppRoleAction, updateB2BAppRoleAction, updateOrganizationEmployeeRoleAction,
    ])

    const getExpandedRowRender = useCallback((permissionsGroup: PermissionsGroup) => (
        <ExpandableRow
            permissionsGroup={permissionsGroup}
            employeeRoles={employeeRoles}
            permissionsState={permissionsState}
            setPermissionsState={setPermissionsState}
        />
    ), [employeeRoles, permissionsState])

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
                    rowKey='key'
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
        refetch: refetchEmployeeRoles,
        objs: employeeRoles,
    } = OrganizationEmployeeRole.useObjects({
        where: { organization: { id: userOrganizationId } },
        sortBy: [SortOrganizationEmployeeRolesBy.NameAsc],
    })

    const {
        objs: b2bAppContexts,
        loading: b2bAppContextsLoading,
    } = B2BAppContext.useObjects({
        where: { organization: { id: userOrganizationId },  status: 'Finished' },
    })

    const connectedB2BApps = useMemo(() =>
        uniqBy(b2bAppContexts.map(context => get(context, 'app')), 'id')
    , [b2bAppContexts])

    const {
        loading: isB2BAppRolesLoading,
        objs: b2BAppRoles,
        refetch: refetchB2BAppRoles,
    } = B2BAppRole.useObjects({
        where: {
            role: { id_in: employeeRoles.map(role => role.id) },
            app: { id_in: connectedB2BApps.map(context => context.id) },
        },
    })

    const createB2BAppRoleAction = B2BAppRole.useCreate({}, () => refetchB2BAppRoles())
    const softDeleteB2BAppRoleAction = B2BAppRole.useSoftDelete(() => refetchB2BAppRoles())
    const updateB2BAppRoleAction = B2BAppRole.useUpdate({}, () => refetchB2BAppRoles())
    const updateOrganizationEmployeeRoleAction = OrganizationEmployeeRole.useUpdate({}, () => refetchEmployeeRoles())

    const {
        loading: isB2BAppPermissionsLoading,
        objs: b2BAppPermissions,
    } = B2BAppPermission.useObjects({
        where: { app: { id_in: connectedB2BApps.map(b2bApp => get(b2bApp, 'id')) } },
    })

    const loading = isEmployeeRolesLoading || isB2BAppRolesLoading || isB2BAppPermissionsLoading || b2bAppContextsLoading

    return <EmployeeRolesTable
        loading={loading}
        createB2BAppRoleAction={createB2BAppRoleAction}
        softDeleteB2BAppRoleAction={softDeleteB2BAppRoleAction}
        updateB2BAppRoleAction={updateB2BAppRoleAction}
        updateOrganizationEmployeeRoleAction={updateOrganizationEmployeeRoleAction}
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

import { MinusCircleTwoTone } from '@ant-design/icons'
import {
    B2BApp,
    B2BAppRoleCreateInput,
    B2BAppRoleUpdateInput, QueryAllB2BAppRolesArgs,
    SortOrganizationEmployeeRolesBy,
} from '@app/condo/schema'
import {
    OrganizationEmployeeRole as OrganizationEmployeeRoleType,
    B2BAppPermission as B2BAppPermissionType,
    B2BAppRole as B2BAppRoleType,
} from '@app/condo/schema'
import { Col, Row, Typography } from 'antd'
import { Table as AntdTable } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { mergeWith, set } from 'lodash'
import { isEqual } from 'lodash'
import cloneDeep from 'lodash/cloneDeep'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import React, {
    Dispatch,
    MutableRefObject, ReactElement,
    RefObject,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

import {
    IGenerateHooksResult,
    IUseCreateActionType,
    IUseSoftDeleteActionType, IUseUpdateActionType,
} from '@open-condo/codegen/generate.hooks'
import { ChevronDown, ChevronUp, Close } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, ActionBarProps, Button, Checkbox } from '@open-condo/ui'

import { Table } from '@condo/domains/common/components/Table/Index'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useEmployeeRolesTableColumns } from '@condo/domains/organization/hooks/useEmployeeRolesTableColumns'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'

import { Loader } from '../../common/components/Loader'
import { B2BAppPermission, B2BAppRole } from '../../miniapp/utils/clientSchema'


const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

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


const TableCheckbox: React.FC<TableCheckboxProps> = ({ employeeRoleId, b2bAppId, permissionKey, permissionState, setPermissionState }) => {
    let value
    let pathToPermissions
    const isReadPermission = permissionKey.startsWith('canRead')
    const isB2bPermission = !!b2bAppId

    if (isB2bPermission) {
        pathToPermissions = [employeeRoleId, 'b2bAppRoles', b2bAppId, 'permissions']
        value = get(permissionState, [...pathToPermissions, permissionKey], false)
    } else {
        pathToPermissions = [employeeRoleId, 'organizationPermissions']
        value = get(permissionState, [...pathToPermissions, permissionKey], false)
    }

    const onChange = useCallback((e) => {
        const newValue = e.target.checked
        const newState = cloneDeep(permissionState)
        const oldPermissions = get(newState, pathToPermissions)
        let newPermissions
        let removedPermissionsToCheck = [permissionKey]

        if (isReadPermission) {
            if (newValue) {
                newPermissions = { ...oldPermissions, [permissionKey]: newValue }
            } else if (!newValue) {
                newPermissions = Object.keys(oldPermissions)
                    .reduce((acc, permission) => ({ ...acc, [permission]: false }), {})
                removedPermissionsToCheck = Object.keys(oldPermissions)
            }
        } else {
            if (newValue) {
                const readPermissionKey = Object.keys(oldPermissions).find(permission => permission.startsWith('canRead'))
                newPermissions = { ...oldPermissions, [permissionKey]: newValue, [readPermissionKey]: true }
            } else {
                newPermissions = { ...oldPermissions, [permissionKey]: newValue }
            }
        }

        set(newState, pathToPermissions, newPermissions)

        // check that at least one employee role has permission
        if (!newValue) {
            const pathToPermissionsFromEmployeeRole = pathToPermissions.splice(1)

            for (const removedPermissionKey of removedPermissionsToCheck) {
                const hasAtLeastOneActiveCheckboxInRow = Object.keys(newState).find(employeeRoleId => {
                    const employeePermission = get(newState, [employeeRoleId, ...pathToPermissionsFromEmployeeRole, removedPermissionKey], false)

                    return employeePermission === true
                })

                if (!hasAtLeastOneActiveCheckboxInRow) {
                    return
                }
            }
        }

        setPermissionState(newState)
    }, [isReadPermission, pathToPermissions, permissionKey, permissionState, setPermissionState])

    return (
        <div style={{ width: '100px' }}>
            <Checkbox checked={Boolean(value)} onChange={onChange} />
        </div>
    )
}

export const EmployeeRolesTable: React.FC<EmployeeRolesTableProps> = ({
    connectedB2BApps, employeeRoles, b2BAppRoles, b2BAppPermissions,
    loading, softDeleteB2BAppRoleAction, updateB2BAppRoleAction, createB2BAppRoleAction,
}) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'EmployeeRoles' })

    const totalRows = connectedB2BApps.length

    const tableColumns = useEmployeeRolesTableColumns(employeeRoles)
    const tableData: PermissionsGroup[] = useMemo(() => connectedB2BApps.map((b2bApp): PermissionsGroup => ({
        id: b2bApp.id,
        groupName: b2bApp.name,
        permissions: [
            {
                id: `canRead${b2bApp.id}`,
                key: `canRead${b2bApp.id}`,
                name: 'Просмотр сервиса',
            },
            ...b2BAppPermissions
                .filter(permission => permission.app.id === b2bApp.id)
                .map((permission): PermissionRow => ({
                    id: permission.id,
                    key: permission.key,
                    name: permission.name,
                })),
        ],
    })), [b2BAppPermissions, connectedB2BApps])

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
            let notificationType: 'create' | 'update' | 'delete'

            for (const appId of Object.keys(newB2bRolePermissions)) {
                const initialEmployeePermissionsInB2BApp = initialB2bRolePermissions[appId]
                const newEmployeePermissionsInB2BApp = newB2bRolePermissions[appId]

                if (!isEqual(initialEmployeePermissionsInB2BApp, newEmployeePermissionsInB2BApp)) {
                    const canReadAppKey = `canRead${appId}`
                    const initialPermissions = initialEmployeePermissionsInB2BApp.permissions
                    const newPermissions = newEmployeePermissionsInB2BApp.permissions
                    // create if no canReadApp in initialB2bRolePermissions and has canReadApp in newB2bRolePermissions
                    const isCreateB2BAppRoleOperation = !initialPermissions[canReadAppKey] && newPermissions[canReadAppKey]
                    // delete if canReadApp in newB2bRolePermissions and no canReadApp in newB2bRolePermissions
                    const isDeleteB2BAppRoleOperation = initialPermissions[canReadAppKey] && !newPermissions[canReadAppKey]
                    // update permissions field if canReadApp doesn't change
                    const isUpdateB2BAppRoleOperation = initialPermissions[canReadAppKey] && newPermissions[canReadAppKey]
                    const b2bAppPermissionsKeys = b2BAppPermissions
                        .filter(permission => permission.app.id === appId)
                        .map(permission => permission.key)
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

        setInitialPermissionState(cloneDeep(permissionState))
        setSubmitActionProcessing(false)
    }, [
        b2BAppPermissions, b2BAppRoles, createB2BAppRoleAction, employeeRoles, initialPermissionState, permissionState,
        softDeleteB2BAppRoleAction, updateB2BAppRoleAction,
    ])

    const getRowClassName = useCallback((record, index) => {
        const classNames = ['condo-table-expandable-row']

        if (record.expanded) {
            classNames.push('condo-table-expandable-row-expanded')
        }
        if (index === tableData.length - 1) {
            classNames.push('condo-table-expandable-row-last-row')
        }

        return classNames.join(' ')
    }, [tableData.length])

    const expandableConfig = useMemo(() => ({
        indentSize: 0,
        expandRowByClick: true,
        columnWidth: '60px',
        expandedRowClassName: () => 'condo-table-expandable-row-inner-row',
        onExpand: (expanded, record) => record.expanded = expanded,
        expandIcon: ({ expanded, onExpand, record }) =>
            expanded ? (
                <ChevronUp size='medium' onClick={e => onExpand(record, e)}/>
            ) : (
                <ChevronDown size='medium' onClick={e => onExpand(record, e)}/>
            ),
        expandedRowRender: (permissionsGroup: PermissionsGroup) => {
            const permissionRows = permissionsGroup.permissions

            const columns = [
                {
                    dataIndex: 'name',
                    width: '20%',
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
                {
                    width: '60px',
                },
            ]

            return <Table
                tableLayout='auto'
                rowClassName='inner-table-row'
                showHeader={false}
                pagination={false}
                dataSource={permissionRows}
                columns={columns}
            />
        },
    }), [employeeRoles, permissionState])

    const test: ActionBarProps['actions'] = useMemo(() => [
        <Button
            key='submit'
            onClick={handleSave}
            type='primary'
            loading={submitActionProcessing}
        >
            Сохранить
        </Button>,
        <Button
            icon={<Close size='medium' />}
            key='close'
            onClick={handleCancel}
            type='secondary'
            disabled={submitActionProcessing}
        >
            Отменить выделение
        </Button>,
    ], [handleCancel, handleSave, submitActionProcessing])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{TitleMessage}</Typography.Title>
            </Col>
            <Col span={24}>
                <Table
                    loading={loading}
                    sticky
                    pagination={false}
                    totalRows={totalRows}
                    dataSource={tableData}
                    columns={tableColumns}
                    data-cy='employeeRoles__table'
                    rowClassName={getRowClassName}
                    expandable={expandableConfig}
                />
            </Col>
            <ActionBar
                actions={test}
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

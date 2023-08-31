import { MinusCircleTwoTone } from '@ant-design/icons'
import { B2BApp, SortOrganizationEmployeeRolesBy } from '@app/condo/schema'
import {
    OrganizationEmployeeRole as OrganizationEmployeeRoleType,
    B2BAppPermission as B2BAppPermissionType,
    B2BAppRole as B2BAppRoleType,
} from '@app/condo/schema'
import { Col, Row, Typography } from 'antd'
import { Table as AntdTable } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import { ChevronDown, ChevronUp } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Checkbox } from '@open-condo/ui'

import { Table } from '@condo/domains/common/components/Table/Index'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useEmployeeRolesTableColumns } from '@condo/domains/organization/hooks/useEmployeeRolesTableColumns'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'

import { Loader } from '../../common/components/Loader'
import { B2BAppPermission, B2BAppRole } from '../../miniapp/utils/clientSchema'

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

type TableCheckboxProps = {
    tableData: PermissionsGroup[]
    setTableData: Dispatch<SetStateAction<PermissionsGroup>>
    outerRecord: PermissionsGroup
    innerRecord: PermissionRow
    employeeRole: OrganizationEmployeeRoleType
}

const Check: React.FC<TableCheckboxProps> = ({ tableData, setTableData, outerRecord, innerRecord, employeeRole }) => {
    const permissionsFromState: PermissionsGroup = tableData.find(
        rowGroup => rowGroup.id === outerRecord.id
    )
    const permissions = permissionsFromState.permissions.find(
        permission => permission.id === innerRecord.id
    )
    const permission = permissions.employeeRolesPermission.find(
        permission => permission.employeeRoleId === employeeRole.id
    )
    const value = get(permission, 'value', false)

    const onChange = useCallback(e => {
        const newValue = e.target.checked

        setTableData(prevData => ({
            ...prevData,

        }))

        // if (permission.isReadPermission) {
        //
        // }
    }, [])

    return (
        <div style={{ width: '100px' }}>
            <Checkbox checked={value} onChange={onChange}/>
        </div>
    )
}

const OUTER_TABLE_ID = 'outer-table'

function getPopupContainer (): HTMLElement {
    if (typeof document !== 'undefined') {
        return document.getElementById(OUTER_TABLE_ID)
    }
}

type PermissionCell = {
    employeeRoleId: string,
    b2bAppRoleId?: string,
    isReadPermission: boolean,
    value: boolean,
}

type PermissionRow = {
    groupId: string,
    id: string,
    key: string,
    name: string,
    relatedPermissionKeys?: string[]
    employeeRolesPermission: {
        [employeeRoleId: string]: PermissionCell
    }
}

type PermissionsGroup = {
    id: string,
    groupName: string
    permissions: {
        [permissionKey: string]: PermissionRow,
    }
}

type EmployeeRolesTableProps = {
    connectedB2BApps: B2BApp[],
    employeeRoles: OrganizationEmployeeRoleType[],
    b2BAppRoles: B2BAppRoleType[],
    b2BAppPermissions: B2BAppPermissionType[],
}

export const EmployeeRolesTable: React.FC<EmployeeRolesTableProps> = (
    { connectedB2BApps, employeeRoles, b2BAppRoles, b2BAppPermissions }
) => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'EmployeeRoles' })

    const totalRows = connectedB2BApps.length
    const tableColumns = useEmployeeRolesTableColumns(employeeRoles)

    const initialTableData: PermissionsGroup[] = useMemo(() => connectedB2BApps.map((b2bApp): PermissionsGroup => ({
        id: b2bApp.id,
        groupName: b2bApp.name,
        permissions: {
            // фейковое право `canRead${b2bApp.id}` через b2bAppRole
            [`canRead${b2bApp.id}`]: {
                groupId: b2bApp.id,
                id: `canRead${b2bApp.id}`,
                key: `canRead${b2bApp.id}`,
                name: 'Просмотр сервиса',
                employeeRolesPermission: employeeRoles
                    .map(employeeRole => {
                        const b2bRole = b2BAppRoles.find(
                            b2bRole => get(b2bRole, 'role.id') === employeeRole.id && get(b2bRole, 'app.id') === b2bApp.id
                        )

                        const result: PermissionCell = {
                            employeeRoleId: employeeRole.id,
                            b2bAppRoleId: get(b2bRole, 'id'),
                            isReadPermission: true,
                            value: !!b2bRole,
                        }

                        return result
                    })
                    .reduce((acc, permissionCell) =>
                        ({ ...acc, [permissionCell.employeeRoleId]: permissionCell }), {}
                    ),
            },
            ...(b2BAppPermissions.map((permission): PermissionRow => ({
                groupId: b2bApp.id,
                id: permission.id,
                key: permission.key,
                name: permission.name,
                employeeRolesPermission: employeeRoles
                    .map(employeeRole => {
                        const b2bRole = b2BAppRoles.find(
                            b2bRole => get(b2bRole, 'role.id') === employeeRole.id && get(b2bRole, 'app.id') === b2bApp.id
                        )

                        const result: PermissionCell = {
                            employeeRoleId: employeeRole.id,
                            b2bAppRoleId: get(b2bRole, 'id'),
                            isReadPermission: false,
                            value: b2bRole ? !!b2bRole.permissions[permission.key] : false,
                        }

                        return result
                    })
                    .reduce((acc, permissionCell) =>
                        ({ ...acc, [permissionCell.employeeRoleId]: permissionCell }), {}
                    ),
            }))
                .reduce((acc, permission) =>
                    ({ ...acc, [permission.key]: permission }), {}
                )),
        },
    })), [b2BAppPermissions, b2BAppRoles, connectedB2BApps, employeeRoles])

    const [tableData, setTableData] = useState<PermissionsGroup[]>(initialTableData)
    useEffect(() => {
        if (isEmpty(tableData)) {
            setTableData(initialTableData)
        }
    }, [initialTableData])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={3}>{TitleMessage}</Typography.Title>
            </Col>
            <Col span={24}>
                <Table
                    id={OUTER_TABLE_ID}
                    sticky
                    pagination={false}
                    totalRows={totalRows}
                    dataSource={tableData}
                    columns={tableColumns}
                    data-cy='employeeRoles__table'
                    rowClassName={(record, index) => {
                        const classNames = ['condo-table-expandable-row']

                        if (record.expanded) {
                            classNames.push('condo-table-expandable-row-expanded')
                        }
                        if (index === tableData.length - 1) {
                            classNames.push('condo-table-expandable-row-last-row')
                        }

                        return classNames.join(' ')
                    }}
                    expandable={{
                        indentSize: 0,
                        expandRowByClick: true,
                        columnWidth: '60px',
                        expandedRowClassName: (record, index, indent) => {
                            return 'condo-table-expandable-row-inner-row'
                        },
                        onExpand: (expanded, record) => {
                            record.expanded = expanded
                        },
                        expandIcon: ({ expanded, onExpand, record }) =>
                            expanded ? (
                                <ChevronUp size='medium' onClick={e => onExpand(record, e)}/>
                            ) : (
                                <ChevronDown size='medium' onClick={e => onExpand(record, e)}/>
                            ),
                        expandedRowRender: (outerRecord: PermissionsGroup) => {
                            const permissionRows = outerRecord.permissions
                            const permissionsList = outerRecord.permissions

                            console.log('permissionRows', permissionRows)

                            const columns = [
                                {
                                    dataIndex: 'name',
                                    width: '20%',
                                },
                                ...employeeRoles.map(employeeRole => {
                                    return {
                                        render: (innerRecord: PermissionRow) => {
                                            console.log('innerRecord', innerRecord)
                                            return <Check/>
                                        },
                                    }
                                }),
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
                                getPopupContainer={getPopupContainer}
                            />
                        },
                    }}
                />
            </Col>
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
    } = B2BAppRole.useObjects({
        where: { role: { id_in: employeeRoles.map(role => role.id) } },
    })

    const connectedB2BApps = uniqBy(b2BAppRoles.map(b2BAppRole => get(b2BAppRole, 'app')), 'id')

    const {
        loading: isB2BAppPermissionsLoading,
        objs: b2BAppPermissions,
    } = B2BAppPermission.useObjects({
        where: { app: { id_in: connectedB2BApps.map(b2bApp => get(b2bApp, 'id')) } },
    })

    const loading = isEmployeeRolesLoading || isB2BAppRolesLoading || isB2BAppPermissionsLoading

    if (loading) return <Loader/>

    return <EmployeeRolesTable
        connectedB2BApps={connectedB2BApps}
        employeeRoles={employeeRoles}
        b2BAppRoles={b2BAppRoles}
        b2BAppPermissions={b2BAppPermissions}
    />
}

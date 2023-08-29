import { MinusCircleTwoTone } from '@ant-design/icons'
import { SortOrganizationEmployeeRolesBy } from '@app/condo/schema'
import { Col, Row, Typography } from 'antd'
import { Table as AntdTable } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import compact from 'lodash/compact'
import get from 'lodash/get'
import omit from 'lodash/omit'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'

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

const Check = ({ initialValue }) => {
    const [checked, setChecked] = useState<boolean>(initialValue)
    const handleChange = e => setChecked(e.target.checked)

    return (
        <div style={{ width: '100px' }}>
            <Checkbox checked={checked} onChange={handleChange} />
        </div>
    )
}

const OUTER_TABLE_ID = 'outer-table'
function getPopupContainer (): HTMLElement {
    if (typeof document !== 'undefined') {
        return document.getElementById(OUTER_TABLE_ID)
    }
}


export const EmployeeRolesSettingsContent = () => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'EmployeeRoles' })

    const userOrganization = useOrganization()
    const userOrganizationId = useMemo(() => get(userOrganization, ['organization', 'id']), [userOrganization])

    const {
        loading: isRolesLoading,
        count: rolesCount,
        objs: roles,
    } = OrganizationEmployeeRole.useObjects({
        where: { organization: { id: userOrganizationId } },
        sortBy: [SortOrganizationEmployeeRolesBy.NameAsc],
    })

    const {
        loading: isB2BAppRolesLoading,
        count: b2BAppRolesCount,
        objs: b2BAppRoles,
    } = B2BAppRole.useObjects({
        where: { role: { id_in: roles.map(role => role.id) } },
    })

    const connectedB2BAppIds = uniq(compact(b2BAppRoles.map(b2BAppRole => get(b2BAppRole, 'app.id'))))

    const {
        loading: isB2BAppPermissionsLoading,
        objs: b2BAppPermissions,
    } = B2BAppPermission.useObjects({
        where: { app: { id_in: connectedB2BAppIds } },
    })

    const totalRows = connectedB2BAppIds.length
    const loading = isRolesLoading || isB2BAppRolesLoading || isB2BAppPermissionsLoading

    const rowGroups = [
        {
            id: '3',
            key: '3',
            groupName: 'Сервисы',
            permissions: [
                {
                    name: 'Подключение сервисов',
                    '1': true,
                    '2': false,
                    '11': false,
                    '22': false,
                    '111': false,
                    '222': false,
                },
            ],
        },
        {
            id: '4',
            key: '4',
            groupName: 'Пропуска',
            permissions: [
                {
                    id: '5',
                    key: '5',
                    name: 'Просмотр пропусков',
                    '1': true,
                    '2': true,
                    '11': false,
                    '22': false,
                    '111': false,
                    '222': false,
                },
                {
                    id: '6',
                    key: '6',
                    name: 'Управление пропусками',
                    '1': true,
                    '2': false,
                    '11': false,
                    '22': false,
                    '111': false,
                    '222': false,
                },
            ],
        },
    ]

    const tableColumns = useEmployeeRolesTableColumns(roles)
    const dataForTable = [...rowGroups]

    if (loading) return <Loader />

    console.log(b2BAppRoles, b2BAppPermissions)

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
                    loading={loading}
                    dataSource={dataForTable}
                    columns={tableColumns}
                    data-cy='employeeRoles__table'
                    rowClassName={(record, index) => {
                        const classNames = ['condo-table-expandable-row']

                        if (record.expanded) {
                            classNames.push('condo-table-expandable-row-expanded')
                        }
                        if (index === dataForTable.length - 1) {
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
                                <ChevronUp size='medium' onClick={e => onExpand(record, e)} />
                            ) : (
                                <ChevronDown size='medium' onClick={e => onExpand(record, e)} />
                            ),
                        expandedRowRender: (record) => {
                            const dataSource = record.permissions

                            const columns = [
                                {
                                    dataIndex: 'name',
                                    width: '20%',
                                },
                                {
                                    dataIndex: '1',
                                    render: (value) => <Check initialValue={value} />,
                                    width: '100px',
                                },
                                {
                                    dataIndex: '2',
                                    render: (value) => <Check initialValue={value} />,
                                    width: '100px',
                                },
                                {
                                    dataIndex: '11',
                                    render: (value) => <Check initialValue={value} />,
                                    width: '100px',
                                },
                                {
                                    dataIndex: '22',
                                    render: (value) => <Check initialValue={value} />,
                                    width: '100px',
                                },
                                {
                                    dataIndex: '111',
                                    render: (value) => <Check initialValue={value} />,
                                    width: '100px',
                                },
                                {
                                    dataIndex: '222',
                                    render: (value) => <Check initialValue={value} />,
                                    width: '100px',
                                },
                                {
                                    width: '60px',
                                },
                            ]

                            return <Table
                                tableLayout='auto'
                                rowClassName='inner-table-row'
                                showHeader={false}
                                pagination={false}
                                dataSource={dataSource}
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

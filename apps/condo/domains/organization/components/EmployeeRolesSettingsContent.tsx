import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { TableComponents } from 'rc-table/lib/interface'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { DEFAULT_PAGE_SIZE, Table, TableRecord } from '@condo/domains/common/components/Table/Index'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useEmployeeRolesTableColumns } from '@condo/domains/organization/hooks/useEmployeeRolesTableColumns'
import { OrganizationEmployeeRole } from '@condo/domains/organization/utils/clientSchema'

const StyledTable = styled(Table)`
  .ant-table-cell-ellipsis {
    white-space: inherit;
  }
  
  .ant-table-cell-row-hover {
    background-color: inherit !important;
    cursor: not-allowed;
  }
`

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

export const EmployeeRolesSettingsContent = () => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'employeeRoles' })
    const EditProhibitedMessage = intl.formatMessage({ id: 'editProhibited' })

    const router = useRouter()
    const { offset } = parseQuery(router.query)

    const userOrganization = useOrganization()
    const userOrganizationId = useMemo(() => get(userOrganization, ['organization', 'id']), [userOrganization])

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const {
        loading: isRolesLoading,
        count: totalRoles,
        objs: roles,
    } = OrganizationEmployeeRole.useObjects({
        where: { organization: { id: userOrganizationId } },
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const tableColumns = useEmployeeRolesTableColumns([])

    const tableComponents: TableComponents<TableRecord> = useMemo(() => ({
        body: {
            row: (props) => (
                <Tooltip showArrow title={EditProhibitedMessage}>
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
                <StyledTable
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

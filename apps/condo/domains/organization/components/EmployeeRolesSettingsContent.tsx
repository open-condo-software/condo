import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useContactRolesTableColumns } from '@condo/domains/contact/hooks/useContactRolesTableColumns'
import { useOrganization } from '@condo/next/organization'
import styled from '@emotion/styled'
import { Col, Row, Typography } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { useIntl } from '@condo/next/intl'
import { useEmployeeRolesTableColumns } from '../hooks/useEmployeeRolesTableColumns'
import { OrganizationEmployeeRole } from '../utils/clientSchema'

const StyledTable = styled(Table)`
  .ant-table-cell-ellipsis {
    white-space: inherit;
  }
`

const MEDIUM_VERTICAL_GUTTER: [Gutter, Gutter] = [0, 40]

export const EmployeeRolesSettingsContent = () => {
    const intl = useIntl()
    const TitleMessage = intl.formatMessage({ id: 'EmployeeRoles' })

    const router = useRouter()
    const { offset } = parseQuery(router.query)

    const userOrganization = useOrganization()
    const userOrganizationId = useMemo(() => get(userOrganization, ['organization', 'id']), [])

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
                />
            </Col>
        </Row>
    )
}

import { SortOrganizationEmployeesBy } from '@app/condo/schema'
import styled from '@emotion/styled'
import { Col, Row } from 'antd'
import { get } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import {
    ActionBar,
    Button,
    Typography,
} from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { usePreviousSortAndFilters } from '@condo/domains/common/hooks/usePreviousQueryParams'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { PageComponentType } from '@condo/domains/common/types'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { EmployeesReadPermissionRequired } from '@condo/domains/organization/components/PageAccess'
import { useTableColumns } from '@condo/domains/organization/hooks/useTableColumns'
import { useTableFilters } from '@condo/domains/organization/hooks/useTableFilters'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { IFilters } from '@condo/domains/organization/utils/helpers'


const ADD_EMPLOYEE_ROUTE = '/employee/create'
const SORTABLE_PROPERTIES = ['name', 'role', 'position', 'phone', 'email']
const EMPLOYEE_DEFAULT_SORT_BY = ['createdAt_DESC']

export const EmployeesPageContent = ({
    tableColumns,
    canManageEmployee,
    employees,
    employeesLoading,
    total,
    addEmployeeLabel = undefined,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.employee.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'employee.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'employee.EmptyList.title' })
    const AddEmployeeLabel = addEmployeeLabel || intl.formatMessage({ id: 'AddEmployee' })

    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    const { GlobalHints } = useGlobalHints()

    const rowClassName = (record) => {
        return record.isBlocked ? 'ant-table-row-inactive' : ''
    }

    const TableWithInactiveEmployee = styled(Table)`
        .ant-table-row-inactive .ant-typography {
            color: ${colors.gray[7]};
        }
    `


    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/employee/${record.id}`)
            },
        }
    }, [])

    const [search, handleSearchChange] = useSearch<IFilters>()

    const handleAddEmployee = () => router.push(ADD_EMPLOYEE_ROUTE)

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>} />
                <TablePageContent>
                    {
                        !employees.length && !filtersFromQuery
                            ? <EmptyListContent
                                label={EmptyListLabel}
                                message={EmptyListMessage}
                                createRoute={ADD_EMPLOYEE_ROUTE}
                                createLabel={AddEmployeeLabel}
                                accessCheck={canManageEmployee}
                            />
                            : <Row gutter={[0, 40]} align='middle'>
                                <Col span={24}>
                                    <TableFiltersContainer>
                                        <Input
                                            placeholder={SearchPlaceholder}
                                            onChange={(e) => {
                                                handleSearchChange(e.target.value)
                                            }}
                                            value={search}
                                            allowClear
                                            suffix={<Search size='medium' color={colors.gray[7]} />}
                                        />
                                    </TableFiltersContainer>
                                </Col>
                                <Col span={24}>
                                    <TableWithInactiveEmployee
                                        totalRows={total}
                                        loading={employeesLoading}
                                        dataSource={employees}
                                        columns={tableColumns}
                                        onRow={handleRowAction}
                                        rowClassName={rowClassName}
                                    />
                                </Col>
                                {
                                    canManageEmployee && (
                                        <Col span={24}>
                                            <ActionBar
                                                actions={[
                                                    <Button
                                                        key='create'
                                                        type='primary'
                                                        onClick={handleAddEmployee}
                                                    >
                                                        {AddEmployeeLabel}
                                                    </Button>,
                                                ]}
                                            />
                                        </Col>
                                    )
                                }
                            </Row>
                    }
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

const EmployeesPage: PageComponentType = () => {
    const { link, organization } = useOrganization()
    const userOrganizationId = get(organization, 'id', null)
    const canManageEmployee = get(link, 'role.canInviteNewOrganizationEmployees', null)
    const employeeId = get(link, 'id')

    usePreviousSortAndFilters({ employeeSpecificKey: employeeId })

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const filtersMeta = useTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, EMPLOYEE_DEFAULT_SORT_BY) as SortOrganizationEmployeesBy[]

    const searchEmployeeQuery = {
        ...filtersToWhere(filters),
        organization: { id: userOrganizationId },
    }

    const {
        loading: employeesLoading,
        count: total,
        objs: employees,
    } = OrganizationEmployee.useObjects({
        sortBy,
        where: searchEmployeeQuery,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
        first: DEFAULT_PAGE_SIZE,
    })

    const tableColumns = useTableColumns(filtersMeta, userOrganizationId, employees)

    return (
        <EmployeesPageContent
            tableColumns={tableColumns}
            canManageEmployee={canManageEmployee}
            employees={employees}
            employeesLoading={employeesLoading}
            total={total}
        />
    )
}

EmployeesPage.requiredAccess = EmployeesReadPermissionRequired

export default EmployeesPage

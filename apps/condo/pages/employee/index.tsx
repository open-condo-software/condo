import { EllipsisOutlined, PlusCircleOutlined } from '@ant-design/icons'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useTableColumns } from '@condo/domains/organization/hooks/useTableColumns'
import { useTableFilters } from '@condo/domains/organization/hooks/useTableFilters'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { IFilters } from '@condo/domains/organization/utils/helpers'
import { SpecializationScope } from '@condo/domains/scope/utils/clientSchema'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Col, Dropdown, Menu, Row, Typography } from 'antd'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import Input from '@condo/domains/common/components/antd/Input'
import { get } from 'lodash'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { SortOrganizationEmployeesBy } from '@app/condo/schema'

const ADD_EMPLOYEE_ROUTE = '/employee/create/'
const SORTABLE_PROPERTIES = ['name', 'role', 'position', 'phone']
const TICKET_HINTS_DEFAULT_SORT_BY = ['createdAt_DESC']

export const EmployeesPageContent = ({
    tableColumns,
    canManageEmployee,
    employees,
    employeesLoading,
    total,
}) => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.employee.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'employee.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'employee.EmptyList.title' })
    const CreateEmployee = intl.formatMessage({ id: 'AddEmployee' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const AddItemUsingUploadLabel = intl.formatMessage({ id: 'AddItemUsingFileUpload' })

    const router = useRouter()
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/employee/${record.id}/`)
            },
        }
    }, [])

    const [search, handleSearchChange] = useSearch<IFilters>(employeesLoading)

    const handleAddEmployee = () => router.push(ADD_EMPLOYEE_ROUTE)

    const dropDownMenu = (
        <Menu>
            <Menu.Item key='1'>
                <Tooltip title={NotImplementedYetMessage}>
                    {AddItemUsingUploadLabel}
                </Tooltip>
            </Menu.Item>
        </Menu>
    )

    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitleMessage}</Typography.Title>}/>
                <TablePageContent>
                    {
                        !employees.length && !filtersFromQuery
                            ? <EmptyListView
                                label={EmptyListLabel}
                                message={EmptyListMessage}
                                createRoute={ADD_EMPLOYEE_ROUTE}
                                createLabel={CreateEmployee}/>
                            : <Row gutter={[0, 40]} align='middle'>
                                <Col span={24}>
                                    <TableFiltersContainer>
                                        <Row justify='space-between' gutter={[0, 40]}>
                                            <Col xs={24} lg={6}>
                                                <Input
                                                    placeholder={SearchPlaceholder}
                                                    onChange={(e) => {
                                                        handleSearchChange(e.target.value)
                                                    }}
                                                    value={search}
                                                    allowClear={true}
                                                />
                                            </Col>
                                        </Row>
                                    </TableFiltersContainer>
                                </Col>
                                <Col span={24}>
                                    <Table
                                        totalRows={total}
                                        loading={employeesLoading}
                                        dataSource={employees}
                                        columns={tableColumns}
                                        onRow={handleRowAction}
                                    />
                                </Col>
                                {
                                    canManageEmployee && (
                                        <Col span={24}>
                                            <ActionBar>
                                                <Button
                                                    type='sberDefaultGradient'
                                                    icon={<PlusCircleOutlined/>}
                                                    onClick={handleAddEmployee}
                                                >
                                                    {CreateEmployee}
                                                </Button>
                                            </ActionBar>
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

const EmployeesPage = () => {
    const { link: { role = {} }, organization }  = useOrganization()
    const userOrganizationId = get(organization, 'id', null)
    const canManageEmployee = get(role, 'canInviteNewOrganizationEmployees', null)

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const filtersMeta = useTableFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, SORTABLE_PROPERTIES)
    const sortBy = sortersToSortBy(sorters, TICKET_HINTS_DEFAULT_SORT_BY) as SortOrganizationEmployeesBy[]

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
    }, {
        fetchPolicy: 'network-only',
    })

    const { objs: specializationScopes } = SpecializationScope.useObjects({
        where: {
            employee: { id_in: employees.map(employee => employee.id) },
        },
    })

    const employeeWithSpecializations = employees.map(employee => {
        const specializations = specializationScopes
            .filter(spec => spec.employee.id === employee.id)
            .map(spec => spec.specialization)

        return { ...employee, specializations }
    })

    const tableColumns = useTableColumns(filtersMeta, userOrganizationId)

    return (
        <EmployeesPageContent
            tableColumns={tableColumns}
            canManageEmployee={canManageEmployee}
            employees={employeeWithSpecializations}
            employeesLoading={employeesLoading}
            total={total}
        />
    )
}

EmployeesPage.requiredAccess = OrganizationRequired

export default EmployeesPage

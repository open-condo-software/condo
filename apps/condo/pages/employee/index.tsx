import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import {
    filtersToQuery,
    getPageIndexFromQuery,
    getSortStringFromQuery,
    EMPLOYEE_PAGE_SIZE,
    sorterToQuery, queryToSorter,
} from '@condo/domains/organization/utils/helpers'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { IFilters } from '@condo/domains/organization/utils/helpers'
import { useIntl } from '@core/next/intl'

import { Col, Input, Row, Table, Typography, Dropdown, Menu, Tooltip } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import Head from 'next/head'
import { useRouter } from 'next/router'
import qs from 'qs'
import { pickBy, get, debounce } from 'lodash'
import React, { useCallback, useState } from 'react'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useTableColumns } from '@condo/domains/organization/hooks/useTableColumns'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useOrganization } from '@core/next/organization'
import { OrganizationEmployee } from '@condo/domains/organization/utils/clientSchema'
import { Button } from '../../domains/common/components/Button'
import { SortOrganizationEmployeesBy } from '../../schema'
import { TitleHeaderAction } from '@condo/domains/common/components/HeaderActions'
const ADD_EMPLOYEE_ROUTE = '/employee/create/'

const TicketsPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.employee.PageTitle' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const EmptyListLabel = intl.formatMessage({ id: 'employee.EmptyList.header' })
    const EmptyListMessage = intl.formatMessage({ id: 'employee.EmptyList.title' })
    const CreateEmployee = intl.formatMessage({ id: 'AddEmployee' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const AddItemUsingFormLabel = intl.formatMessage({ id: 'AddItemUsingForm' })
    const AddItemUsingUploadLabel = intl.formatMessage({ id: 'AddItemUsingFileUpload' })

    const router = useRouter()
    const sortFromQuery = sorterToQuery(queryToSorter(getSortStringFromQuery(router.query)))
    const offsetFromQuery = getPageIndexFromQuery(router.query)
    const filtersFromQuery = getFiltersFromQuery<IFilters>(router.query)

    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const {
        fetchMore,
        loading,
        count: total,
        objs: tickets,
    } = OrganizationEmployee.useObjects({
        sortBy: sortFromQuery.length > 0  ? sortFromQuery : ['createdAt_DESC'] as Array<SortOrganizationEmployeesBy>, //TODO(Dimitreee):Find cleanest solution
        where: { ...filtersToQuery(filtersFromQuery), organization: { id: userOrganizationId } },
        skip: (offsetFromQuery * EMPLOYEE_PAGE_SIZE) - EMPLOYEE_PAGE_SIZE,
        first: EMPLOYEE_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })
    const [filtersApplied, setFiltersApplied] = useState(false)

    const tableColumns = useTableColumns(userOrganizationId, sortFromQuery, filtersFromQuery, setFiltersApplied)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/employee/${record.id}/`)
            },
        }
    }, [])

    const handleTableChange = useCallback(debounce((...tableChangeArguments) => {
        const [nextPagination, nextFilters, nextSorter] = tableChangeArguments

        const { current, pageSize } = nextPagination
        const offset = filtersApplied ? 0 : current * pageSize - pageSize
        const sort = sorterToQuery(nextSorter)
        const filters = filtersToQuery(nextFilters)
        setFiltersApplied(false)

        if (!loading) {
            fetchMore({
                // @ts-ignore
                sortBy: sort,
                where: filters,
                skip: offset,
                first: EMPLOYEE_PAGE_SIZE,
            }).then(() => {
                const query = qs.stringify(
                    { ...router.query, sort, offset, filters: JSON.stringify(pickBy({ ...filtersFromQuery, ...nextFilters })) },
                    { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
                )

                router.push(router.route + query)
            })
        }
    }, 400), [loading])

    const [search, handleSearchChange] = useSearch<IFilters>(loading)

    const handleAddEmployee = () => router.push(ADD_EMPLOYEE_ROUTE)

    const dropDownMenu = (
        <Menu>
            <Menu.Item key="1" onClick={handleAddEmployee}>
                {AddItemUsingFormLabel}
            </Menu.Item>
            <Menu.Item key="2">
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
                <OrganizationRequired>
                    <PageContent>
                        {
                            !tickets.length && !filtersFromQuery
                                ? <EmptyListView
                                    label={EmptyListLabel}
                                    message={EmptyListMessage}
                                    createRoute={ADD_EMPLOYEE_ROUTE}
                                    createLabel={CreateEmployee} />
                                : <Row gutter={[0, 40]} align={'middle'}>
                                    <Col span={24}>
                                        <Row justify={'space-between'}>
                                            <Col span={6}>
                                                <Input
                                                    placeholder={SearchPlaceholder}
                                                    onChange={(e)=>{handleSearchChange(e.target.value)}}
                                                    value={search}
                                                />
                                            </Col>
                                            <Dropdown.Button
                                                overlay={dropDownMenu}
                                                buttonsRender={() => [
                                                    <Button
                                                        key='left'
                                                        type={'sberPrimary'}
                                                        style={{ borderRight: '1px solid white' }}
                                                        onClick={() => router.push(ADD_EMPLOYEE_ROUTE)}
                                                    >
                                                        {CreateEmployee}
                                                    </Button>,
                                                    <Button
                                                        key='right'
                                                        type={'sberPrimary'}
                                                        style={{ borderLeft: '1px solid white', lineHeight: '150%' }}
                                                        icon={<EllipsisOutlined />}
                                                    />,
                                                ]}
                                            />
                                        </Row>
                                    </Col>
                                    <Col span={24}>
                                        <Table
                                            bordered
                                            tableLayout={'fixed'}
                                            loading={loading}
                                            dataSource={tickets}
                                            columns={tableColumns}
                                            onRow={handleRowAction}
                                            onChange={handleTableChange}
                                            rowKey={record => record.id}
                                            pagination={{
                                                total,
                                                current: offsetFromQuery,
                                                pageSize: EMPLOYEE_PAGE_SIZE,
                                                position: ['bottomLeft'],
                                            }}
                                        />
                                    </Col>
                                </Row>
                        }
                    </PageContent>
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

TicketsPage.headerAction = <TitleHeaderAction descriptor={{ id: 'pages.condo.employee.PageTitle' }}/>

export default TicketsPage

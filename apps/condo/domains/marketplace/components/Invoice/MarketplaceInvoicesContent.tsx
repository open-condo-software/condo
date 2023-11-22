import { SortInvoicesBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import Input from '@condo/domains/common/components/antd/Input'
import EmptyListView from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { getFiltersFromQuery, getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useMarketplaceInvoicesFilters } from '@condo/domains/marketplace/hooks/useMarketplaceInvoicesFilters'
import { useMarketplaceInvoicesTableColumns } from '@condo/domains/marketplace/hooks/useMarketplaceInvoicesTableColumns'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'


const TableContent = () => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    const router = useRouter()
    const { organization } = useOrganization()
    const { filters, offset, sorters } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const filtersMeta = useMarketplaceInvoicesFilters()
    const columns = useMarketplaceInvoicesTableColumns({ filtersMeta })
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, ['createdAt', 'number', 'toPay'])
    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortInvoicesBy[], [sorters, sortersToSortBy])

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/marketplace/invoice/${record.id}`)
            },
        }
    }, [router])

    const {
        loading: invoicesLoading,
        count: totalInvoices,
        objs: invoices,
    } = Invoice.useObjects({
        sortBy,
        where: {
            ...filtersToWhere(filters),
            context: {
                organization: { id: organization.id },
            },
        },
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const [search, handleSearchChange] = useSearch()
    const handleSearch = useCallback((e) => handleSearchChange(e.target.value), [handleSearchChange])

    const filtersFromQuery = useMemo(() => getFiltersFromQuery(router.query), [router.query])
    const createdAtValueFromQuery = useMemo(() => get(filtersFromQuery, 'createdAt'), [filtersFromQuery])
    const initialValue = createdAtValueFromQuery ?
        [dayjs(createdAtValueFromQuery[0]), dayjs(createdAtValueFromQuery[1])] :
        [dayjs().subtract(6, 'days'), dayjs()]

    const [dateRange, setDateRange] = useState()
    const handleDateRangeChange = useCallback(async (value) => {
        setDateRange(value)
        const newParameters = getFiltersQueryData({ ...filtersFromQuery, createdAt: value })
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false })
    }, [filtersFromQuery, router])

    useEffect(() => {
        if (!dateRange) {
            handleDateRangeChange(initialValue)
        }
    }, [])

    const disabledDate = useCallback((currentDate) => {
        return currentDate && currentDate < dayjs().startOf('year')
    }, [])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row gutter={[24, 24]} align='middle'>
                        <Col xs={24} lg={7}>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={handleSearch}
                                value={search}
                                allowClear
                            />
                        </Col>
                        <Col>
                            <DateRangePicker
                                value={dateRange}
                                onChange={handleDateRangeChange}
                                allowClear={false}
                                disabledDate={disabledDate}
                            />
                        </Col>
                    </Row>
                </TableFiltersContainer>
            </Col>
            <Col span={24}>
                <Table
                    totalRows={totalInvoices}
                    loading={invoicesLoading}
                    dataSource={invoices}
                    columns={columns}
                    onRow={handleRowAction}
                />
            </Col>
        </Row>
    )
}

export const MarketplaceInvoicesContent = () => {
    const intl = useIntl()
    const BillsEmptyTitle = intl.formatMessage({ id: 'pages.condo.marketplace.bills.empty.title' })
    const BillsEmptyText = intl.formatMessage({ id: 'pages.condo.marketplace.bills.empty.text' })
    const BillsEmptyButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.bills.empty.buttonText' })

    const { organization, link } = useOrganization()
    const role = get(link, ['role'], {})
    const canManageInvoices = get(role, ['canManageInvoices'], false)

    const { count, loading } = Invoice.useCount({
        where: {
            context: {
                organization: { id: organization.id },
            },
        },
    })

    if (loading) {
        return <Loader />
    }

    if (count === 0) {
        return <EmptyListView
            label={BillsEmptyTitle}
            message={BillsEmptyText}
            createLabel={BillsEmptyButtonText}
            createRoute='/marketplace/invoice/create'
            accessCheck={canManageInvoices}
        />
    }

    return (
        <TableContent />
    )
}
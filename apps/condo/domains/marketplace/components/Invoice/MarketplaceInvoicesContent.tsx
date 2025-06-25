import { SortInvoicesBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'
import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import Input from '@condo/domains/common/components/antd/Input'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { Loader } from '@condo/domains/common/components/Loader'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { getFiltersFromQuery, getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useMarketplaceInvoicesFilters } from '@condo/domains/marketplace/hooks/useMarketplaceInvoicesFilters'
import { useMarketplaceInvoicesTableColumns } from '@condo/domains/marketplace/hooks/useMarketplaceInvoicesTableColumns'
import { Invoice, MARKETPLACE_PAGE_TYPES } from '@condo/domains/marketplace/utils/clientSchema'


const TableContent = () => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CreateInvoiceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.invoiceList.createInvoice' })

    const breakpoints = useBreakpoints()
    const router = useRouter()
    const { organization, link } = useOrganization()
    const role = get(link, ['role'], {})
    const canManageInvoices = get(role, ['canManageInvoices'], false)
    const { filters, offset, sorters } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const filtersMeta = useMarketplaceInvoicesFilters()
    const columns = useMarketplaceInvoicesTableColumns({ filtersMeta })
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, ['createdAt', 'number', 'toPay', 'property', 'unitName'])
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
            organization: { id: get(organization, 'id', null) },
        },
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const [search, handleSearchChange] = useSearch()
    const handleSearch = useCallback((e) => handleSearchChange(e.target.value), [handleSearchChange])

    const [dateRange, setDateRange] = useDateRangeSearch('createdAt')
    const filtersFromQuery = useMemo(() => getFiltersFromQuery(router.query), [router.query])

    useEffect(() => {
        const createdAt = [dayjs().subtract(6, 'days').toString(), dayjs().toString()]
        const newParameters = getFiltersQueryData(
            { ...filtersFromQuery, createdAt }
        )
        updateQuery(router, {
            newParameters: { ...newParameters, tab: MARKETPLACE_PAGE_TYPES.bills },
        }, {
            routerAction: 'replace', resetOldParameters: false, shallow: true,
        })
    }, [])

    const disabledDate = useCallback((currentDate) => {
        return currentDate && currentDate < dayjs().subtract(12, 'month')
    }, [])

    const handleCreateButtonClick = useCallback(async () => {
        await router.push('/marketplace/invoice/create')
    }, [router])

    return (
        <Row gutter={[0, 40]}>
            <Col span={24}>
                <TableFiltersContainer>
                    <Row gutter={[16, 16]} align='middle'>
                        <Col span={24}>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={handleSearch}
                                value={search}
                                allowClear
                                suffix={<Search size='medium' color={colors.gray[7]} />}
                            />
                        </Col>
                        <Col span={!breakpoints.TABLET_SMALL && 24}>
                            <DateRangePicker
                                style={!breakpoints.TABLET_SMALL ? { width: '100%' } : null}
                                value={dateRange}
                                onChange={setDateRange}
                                allowClear
                                disabledDate={disabledDate}
                                defaultValue={[dayjs().subtract(6, 'days'), dayjs()]}
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
            {
                canManageInvoices && (
                    <Col span={24}>
                        <ActionBar
                            actions={[
                                <Button
                                    key='createInvoice'
                                    type='primary'
                                    onClick={handleCreateButtonClick}
                                >
                                    {CreateInvoiceMessage}
                                </Button>,
                            ]}
                        />
                    </Col>
                )
            }
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
            organization: { id: get(organization, 'id', null) },
        },
    })

    if (loading) {
        return <Loader />
    }

    if (count === 0) {
        return <EmptyListContent
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

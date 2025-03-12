import { Col, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useState } from 'react'

import { Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { colors } from '@open-condo/ui/dist/colors'

import { PaymentsSumTable } from '@condo/domains/acquiring/components/payments/PaymentsSumTable'
import { PaymentsSumInfo } from '@condo/domains/acquiring/components/payments/PaymentsTable'
import { usePaymentsFilesTableColumns } from '@condo/domains/acquiring/hooks/usePaymentsFilesTableColumns'
import { usePaymentsFilesTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsFilesTableFilters'
import usePaymentsSum from '@condo/domains/acquiring/hooks/usePaymentsSum'
import { PaymentsFile } from '@condo/domains/acquiring/utils/clientSchema'
import { IPaymentsFilesFilters } from '@condo/domains/acquiring/utils/helpers'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import Input from '@condo/domains/common/components/antd/Input'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { MultipleFilterContextProvider } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'

import type { SortPaymentsFilesBy } from '@app/condo/schema'


const SORTABLE_PROPERTIES = ['amount']
const PAYMENTS_DEFAULT_SORT_BY = ['dateLoad_DESC']
const DEFAULT_CURRENCY_CODE = 'RUB'
const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(1, 'week'), dayjs()]

const ROW_GUTTER: [Gutter, Gutter] = [0, 30]
const TAP_BAR_ROW_GUTTER: [Gutter, Gutter] = [0, 20]
const SUM_BAR_COL_GUTTER: [Gutter, Gutter] = [40, 0]
const DATE_PICKER_COL_LAYOUT = { span: 11, offset: 1 }


const PaymentFilesTableContent: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const TotalsSumTitle = intl.formatMessage({ id: 'pages.condo.payments.TotalSum' })

    const { acquiringContext, billingContext } = useBillingAndAcquiringContexts()

    const { breakpoints } = useLayoutContext()
    const router = useRouter()
    const userOrganization = useOrganization()

    const { filters, sorters, offset } = parseQuery(router.query)

    const currencyCode = get(billingContext, ['integration', 'currencyCode'], DEFAULT_CURRENCY_CODE)

    const tableColumns = usePaymentsFilesTableColumns(currencyCode)

    const organizationId = get(userOrganization, ['organization', 'id'], '')
    const queryMetas = usePaymentsFilesTableFilters(organizationId)

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, SORTABLE_PROPERTIES)

    const [filtersAreReset, setFiltersAreReset] = useState(false)
    const dateFallback = filtersAreReset ? null : DEFAULT_DATE_RANGE
    const [dateRange, setDateRange] = useDateRangeSearch('dateLoad')
    const dateFilterValue = dateRange || dateFallback
    const dateFilter = dateFilterValue ? dateFilterValue.map(el => el.toISOString()) : null

    const searchPaymentsFilesQuery: Record<string, unknown> = {
        ...filtersToWhere({ dateLoad: dateFilter, ...filters }),
        acquiringContext: { id: acquiringContext.id },
    }
    const sortBy = sortersToSortBy(sorters, PAYMENTS_DEFAULT_SORT_BY)

    const {
        loading,
        count,
        objs,
    } = PaymentsFile.useObjects({
        where: searchPaymentsFilesQuery,
        sortBy: sortBy as SortPaymentsFilesBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })


    const { data: sumAllPayments, loading: sumAllPaymentsLoading } = usePaymentsSum({ paymentsFilesWhere: searchPaymentsFilesQuery })

    const [search, handleSearchChange, handleResetSearch] = useSearch<IPaymentsFilesFilters>()
    const handleDateChange = useCallback((value) => {
        if (!value) {
            setFiltersAreReset(true)
        }
        setDateRange(value)
    }, [setDateRange])


    return (
        <>
            <Row gutter={ROW_GUTTER} align='middle' justify='center'>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row justify={breakpoints.DESKTOP_SMALL ? 'end' : 'start'} gutter={TAP_BAR_ROW_GUTTER}>
                            <Col flex='auto'>
                                <Row gutter={TAP_BAR_ROW_GUTTER}>
                                    <Col xs={24} lg={8}>
                                        <Input
                                            placeholder={SearchPlaceholder}
                                            value={search}
                                            onChange={(e) => {
                                                handleSearchChange(e.target.value)
                                            }}
                                            allowClear
                                            suffix={<Search size='medium' color={colors.gray[7]} />}
                                        />
                                    </Col>
                                    <Col xs={24} lg={DATE_PICKER_COL_LAYOUT}>
                                        <DateRangePicker
                                            value={dateRange || dateFallback}
                                            onChange={handleDateChange}
                                            placeholder={[StartDateMessage, EndDateMessage]}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>

                <Col span={24}>
                    <PaymentsSumTable>
                        <Row justify='center' gutter={SUM_BAR_COL_GUTTER}>
                            <Col>
                                <PaymentsSumInfo
                                    title={TotalsSumTitle}
                                    message={sumAllPayments?.result?.sum}
                                    currencyCode={currencyCode}
                                    loading={sumAllPaymentsLoading}
                                />
                            </Col>
                        </Row>
                    </PaymentsSumTable>
                </Col>

                <Col span={24}>
                    <Table
                        loading={loading}
                        dataSource={objs}
                        totalRows={count}
                        columns={tableColumns}
                    />
                </Col>
            </Row>
        </>
    )
}

const PaymentFilesTable = (props) => {
    return (
        <MultipleFilterContextProvider>
            <PaymentFilesTableContent {...props} />
        </MultipleFilterContextProvider>
    )
}

export default PaymentFilesTable
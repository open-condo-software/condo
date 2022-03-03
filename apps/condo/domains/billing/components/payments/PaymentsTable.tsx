import { PaymentWhereInput, SortPaymentsBy } from '@app/condo/schema'
import { EXPORT_PAYMENTS_TO_EXCEL } from '@condo/domains/acquiring/gql'
import { Payment } from '@condo/domains/acquiring/utils/clientSchema'
import { usePaymentsTableColumns } from '@condo/domains/billing/hooks/usePaymentsTableColumns'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import {
    getDayRangeFilter,
    getPageIndexFromOffset,
    getStringContainsFilter,
    parseQuery,
    QueryMeta,
} from '@condo/domains/common/utils/tables.utils'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Col, Input, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { get } from 'lodash'
import { useRouter } from 'next/router'
import React from 'react'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'

const addressFilter = getStringContainsFilter(['receipt', 'property', 'address'])
const accountFilter = getStringContainsFilter(['accountNumber'])
const typeFilter = getStringContainsFilter(['context', 'integration', 'name'])
const transactionFilter = getStringContainsFilter(['multiPayment', 'transactionId'])
const dateFilter = getDayRangeFilter(['advancedAt'])

const SORTABLE_PROPERTIES = ['advancedAt', 'amount']
const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(1, 'week'), dayjs()]

const PaymentsTable = ({ billingContext }): JSX.Element => {
    const intl = useIntl()
    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const userOrganization = useOrganization()

    const organizationId = get(userOrganization, ['organization', 'id'], '')
    const { filters, sorters, offset } = parseQuery(router.query)
    const queryMetas: Array<QueryMeta<PaymentWhereInput>> = [
        { keyword: 'dateRange', filters: [dateFilter] },
        {
            keyword: 'search',
            filters: [addressFilter, accountFilter, typeFilter, transactionFilter],
            combineType: 'OR',
        },
    ]
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, SORTABLE_PROPERTIES)

    const searchPaymentsQuery = { ...filtersToWhere(filters), organization: { id: organizationId } }

    const {
        loading,
        count,
        objs,
        error,
    } = Payment.useObjects({
        where: searchPaymentsQuery,
        sortBy: sortersToSortBy(sorters) as SortPaymentsBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const [search, handleSearchChange] = useSearch(loading)
    const [dateRange, setDateRange] = useDateRangeSearch('dateRange', loading, DEFAULT_DATE_RANGE)

    const currencyCode = get(billingContext, ['integration', 'currencyCode'], 'RUB')
    const tableColumns = usePaymentsTableColumns(currencyCode)

    if (loading) {
        return <Loader fill/>
    }

    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    return (
        <>
            <Row gutter={[0, 40]}>
                <Col xs={24} sm={12} lg={8}>
                    <Input
                        placeholder={SearchPlaceholder}
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </Col>
                <Col xs={24} sm={{ span: 11, offset: 1 }} lg={{ span: 7, offset: 1 }}>
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) => setDateRange(range)}
                    />
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
            <ExportToExcelActionBar
                hidden={isSmall}
                searchObjectsQuery={search}
                sortBy={'amount'}
                exportToExcelQuery={EXPORT_PAYMENTS_TO_EXCEL}
            />
        </>
    )
}

export default PaymentsTable
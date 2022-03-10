import { FilterFilled } from '@ant-design/icons'
import { SortPaymentsBy } from '@app/condo/schema'
import { EXPORT_PAYMENTS_TO_EXCEL } from '@condo/domains/acquiring/gql'
import { usePaymentsTableColumns } from '@condo/domains/acquiring/hooks/usePaymentsTableColumns'
import { usePaymentsTableFilters } from '@condo/domains/acquiring/hooks/usePaymentsTableFilters'
import { Payment, PaymentsFilterTemplate } from '@condo/domains/acquiring/utils/clientSchema'
import { Button } from '@condo/domains/common/components/Button'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, getTableScrollConfig, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Col, Input, Row } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { get } from 'lodash'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'

const SORTABLE_PROPERTIES = ['advancedAt', 'amount']
const PAYMENTS_DEFAULT_SORT_BY = ['advancedAt_DESC']
const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(1, 'week'), dayjs()]

const PaymentsTable = ({ billingContext }): JSX.Element => {
    const intl = useIntl()
    const searchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const filtersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })

    const { isSmall } = useLayoutContext()
    const router = useRouter()
    const userOrganization = useOrganization()

    const organizationId = get(userOrganization, ['organization', 'id'], '')
    const { filters, sorters, offset } = parseQuery(router.query)

    const reduceNonEmpty = (cnt, filter) => cnt + Number(Array.isArray(filters[filter]) && filters[filter].length > 0)
    const appliedFiltersCount = Object.keys(filters).reduce(reduceNonEmpty, 0)

    const currencyCode = get(billingContext, ['integration', 'currencyCode'], 'RUB')
    const tableColumns = usePaymentsTableColumns(currencyCode)

    const queryMetas = usePaymentsTableFilters(billingContext, organizationId)

    const {
        MultipleFiltersModal,
        ResetFiltersModalButton,
        setIsMultipleFiltersModalVisible,
    } = useMultipleFiltersModal(queryMetas, PaymentsFilterTemplate)

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, SORTABLE_PROPERTIES)

    const searchPaymentsQuery: Record<string, unknown> = {
        ...filtersToWhere(filters),
        organization: { id: organizationId },
        deletedAt: null,
    }

    const sortBy = sortersToSortBy(sorters, PAYMENTS_DEFAULT_SORT_BY)

    const {
        loading,
        count,
        objs,
        error,
    } = Payment.useObjects({
        where: searchPaymentsQuery,
        sortBy: sortBy as SortPaymentsBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const [search, handleSearchChange] = useSearch(loading)
    const [dateRange, setDateRange] = useDateRangeSearch('advancedAt', loading)

    useEffect(() => {
        if (!dateRange && appliedFiltersCount < 1) {
            setDateRange(DEFAULT_DATE_RANGE)
        }
    }, [])

    if (loading) {
        return <Loader fill/>
    }

    return (
        <>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <Row>
                        <Col xs={24} sm={12} lg={8}>
                            <Input
                                placeholder={searchPlaceholder}
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
                        <Col>
                            <Row justify={'end'} align={'middle'}>
                                {
                                    appliedFiltersCount > 0 && (
                                        <Col>
                                            <ResetFiltersModalButton/>
                                        </Col>
                                    )
                                }
                                <Col>
                                    <Button
                                        secondary
                                        type={'sberPrimary'}
                                        onClick={() => setIsMultipleFiltersModalVisible(true)}
                                    >
                                        <FilterFilled/>
                                        {filtersButtonLabel}
                                        {appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : null}
                                    </Button>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>

                <Col span={24}>
                    <Table
                        loading={loading}
                        dataSource={objs}
                        totalRows={count}
                        columns={tableColumns}
                        scroll={getTableScrollConfig(isSmall)}
                    />
                </Col>
            </Row>
            <ExportToExcelActionBar
                hidden={isSmall}
                searchObjectsQuery={searchPaymentsQuery}
                sortBy={sortBy}
                exportToExcelQuery={EXPORT_PAYMENTS_TO_EXCEL}
                disabled={count < 1}
            />
            <MultipleFiltersModal/>
        </>
    )
}

export default PaymentsTable
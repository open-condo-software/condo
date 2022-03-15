import React, { useCallback, useState } from 'react'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { IContextProps } from './index'
import {
    QueryMeta,
    getStringContainsFilter,
    getPageIndexFromOffset,
    parseQuery, getTableScrollConfig,
} from '@condo/domains/common/utils/tables.utils'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import { Table, DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { BillingReceipt } from '@condo/domains/billing/utils/clientSchema'
import { BillingReceiptWhereInput, SortBillingReceiptsBy } from '@app/condo/schema'
import get from 'lodash/get'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { usePeriodSelector } from '@condo/domains/billing/hooks/usePeriodSelector'
import { Row, Col, Input, Select, Typography } from 'antd'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useReceiptTableColumns } from '@condo/domains/billing/hooks/useReceiptTableColumns'
import { ServicesModal } from '../ServicesModal'
import { IBillingReceiptUIState } from '@condo/domains/billing/utils/clientSchema/BillingReceipt'

const addressFilter = getStringContainsFilter(['property', 'address'])
const accountFilter = getStringContainsFilter(['account', 'number'])
const periodFilter = (period: string) => ({ period })
const staticQueryMetas: Array<QueryMeta<BillingReceiptWhereInput>> = [
    { keyword: 'address', filters: [addressFilter] },
    { keyword: 'account', filters: [accountFilter] },
]

const SORTABLE_PROPERTIES = ['toPay']

export const ReceiptsTable: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const DataForTitle = intl.formatMessage({ id: 'DataFor' })
    const LoadingErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const { isSmall } = useLayoutContext()

    const contextPeriod = get(context, ['lastReport', 'period'], null)
    const currencyCode = get(context, ['integration', 'currencyCode'], 'RUB')

    const queryMetas: Array<QueryMeta<BillingReceiptWhereInput>> = [
        ...staticQueryMetas,
        { keyword: 'period', filters: [periodFilter], defaultValue: contextPeriod },
        { keyword: 'search', filters: [addressFilter, accountFilter], combineType: 'OR' },
    ]
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, SORTABLE_PROPERTIES)
    const {
        loading,
        count: total,
        objs: receipts,
        error,
    } = BillingReceipt.useObjects({
        where: { ...filtersToWhere(filters), context: { id: context.id } },
        sortBy: sortersToSortBy(sorters) as SortBillingReceiptsBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const [search, handleSearchChange] = useSearch(loading)
    const [period, options, handlePeriodChange] = usePeriodSelector(contextPeriod)

    let hasToPayDetails = get(context, ['integration', 'dataFormat', 'hasToPayDetails'], false)
    let hasServices = get(context, ['integration', 'dataFormat', 'hasServices'], false)
    let hasServicesDetails = get(context, ['integration', 'dataFormat', 'hasServicesDetails'], false)

    const integrationOptionName = get(context, 'integrationOption')
    if (integrationOptionName) {
        const integrationOptions = get(context, ['integration', 'availableOptions', 'options'], [])
            .filter(option => option.name === integrationOptionName)
        if (integrationOptions.length) {
            const [integrationOption] = integrationOptions
            const dataFormat = get(integrationOption, 'dataFormat')
            if (dataFormat) {
                hasToPayDetails = dataFormat.hasToPayDetails
                hasServices = dataFormat.hasServices
                hasServicesDetails = dataFormat.hasServicesDetails
            }
        }
    }

    const mainTableColumns = useReceiptTableColumns(hasToPayDetails, currencyCode)

    const [modalIsVisible, setModalIsVisible] = useState(false)
    const [detailedReceipt, setDetailedReceipt] = useState<IBillingReceiptUIState>(null)
    const showServiceModal = (receipt: IBillingReceiptUIState) => {
        setModalIsVisible(true)
        setDetailedReceipt(receipt || null)
        return
    }
    const hideServiceModal = () => {
        setModalIsVisible(false)
    }

    const onRow = useCallback((record: IBillingReceiptUIState) => {
        return {
            onClick: () => {
                if (hasServices) {
                    showServiceModal(record)
                }
            },
        }
    }, [hasServices])

    if (error) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={4}>
                    {LoadingErrorMessage}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }

    return (
        <>
            <Row gutter={[0, 40]}>
                <Col span={7}>
                    <Input
                        placeholder={SearchPlaceholder}
                        onChange={(e) => {handleSearchChange(e.target.value)}}
                        value={search}
                    />
                </Col>
                {options.length > 0 && (
                    <Col span={7} offset={1}>
                        <Select
                            defaultValue={contextPeriod}
                            value={period}
                            onChange={(newValue) => handlePeriodChange(newValue)}
                        >
                            {
                                options.map((option, index) => {
                                    return (
                                        <Select.Option value={option.value} key={index}>
                                            {`${DataForTitle} ${option.title}`}
                                        </Select.Option>
                                    )
                                })
                            }
                        </Select>
                    </Col>

                )}
                <Col span={24}>
                    <Table
                        scroll={getTableScrollConfig(isSmall)}
                        loading={loading}
                        totalRows={total}
                        dataSource={receipts}
                        columns={mainTableColumns}
                        onRow={onRow}
                    />
                </Col>
            </Row>
            <ServicesModal
                receipt={detailedReceipt}
                visible={modalIsVisible}
                onOk={hideServiceModal}
                onCancel={hideServiceModal}
                isDetailed={hasServicesDetails}
                currencyCode={currencyCode}
            />
        </>
    )
}
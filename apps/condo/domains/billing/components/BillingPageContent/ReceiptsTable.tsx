import React, { useCallback, useState } from 'react'
import { IContextProps } from './index'
import {
    getPageIndexFromOffset,
    parseQuery,
    categoryToSearchQuery,
} from '@condo/domains/common/utils/tables.utils'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useRouter } from 'next/router'
import { useIntl } from '@open-condo/next/intl'
import { Table, DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { BillingReceipt } from '@condo/domains/billing/utils/clientSchema'
import { SortBillingReceiptsBy, BillingReceipt as BillingReceiptType } from '@app/condo/schema'
import get from 'lodash/get'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { usePeriodSelector } from '@condo/domains/billing/hooks/usePeriodSelector'
import { Row, Col, Typography } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import Select from '@condo/domains/common/components/antd/Select'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useReceiptTableColumns } from '@condo/domains/billing/hooks/useReceiptTableColumns'
import { ServicesModal } from '../ServicesModal'
import { useReceiptTableFilters } from '@condo/domains/billing/hooks/useReceiptTableFilters'


const SORTABLE_PROPERTIES = ['toPay']

export const ReceiptsTable: React.FC<IContextProps> = ({ context }) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const DataForTitle = intl.formatMessage({ id: 'DataFor' })
    const LoadingErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const contextPeriod = get(context, ['lastReport', 'period'], null)
    const currencyCode = get(context, ['integration', 'currencyCode'], 'RUB')

    const filterMetas = useReceiptTableFilters(context)
    const [search, handleSearchChange] = useSearch()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)
    const categorySearch = categoryToSearchQuery(search, intl.messages)
    const filtersToPass = filtersToWhere(filters)

    if ( filtersToPass.AND.length > 1 ){
        filtersToPass.AND[1].OR ? categorySearch && filtersToPass.AND[1].OR.push(categorySearch) :
            categorySearch ? filtersToPass.AND[1].OR = categorySearch : null
    }

    const {
        loading,
        count: total,
        objs: receipts,
        error,
    } = BillingReceipt.useObjects({
        where: { ...filtersToPass, context: { id: context.id } },
        sortBy: sortersToSortBy(sorters) as SortBillingReceiptsBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const [period, options, handlePeriodChange] = usePeriodSelector(contextPeriod)

    const hasToPayDetails = get(context, ['integration', 'dataFormat', 'hasToPayDetails'], false)
    const hasServices = get(context, ['integration', 'dataFormat', 'hasServices'], false)
    const hasServicesDetails = get(context, ['integration', 'dataFormat', 'hasServicesDetails'], false)

    const mainTableColumns = useReceiptTableColumns(filterMetas, hasToPayDetails, currencyCode)

    const [modalIsVisible, setModalIsVisible] = useState(false)
    const [detailedReceipt, setDetailedReceipt] = useState<BillingReceiptType>(null)
    const showServiceModal = (receipt: BillingReceiptType) => {
        setModalIsVisible(true)
        setDetailedReceipt(receipt || null)
        return
    }
    const hideServiceModal = () => {
        setModalIsVisible(false)
    }

    const onRow = useCallback((record: BillingReceiptType) => {
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
                        allowClear
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

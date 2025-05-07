import { SortBillingReceiptsBy, BillingReceipt as BillingReceiptType, TourStepTypeType } from '@app/condo/schema'
import { Row, Col, Typography, Space } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState, CSSProperties, useEffect } from 'react'

import bridge from '@open-condo/bridge'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useIntl } from '@open-condo/next/intl'

import { ServicesModal } from '@condo/domains/billing/components/BillingPageContent/ServicesModal'
import { useReceiptTableColumns } from '@condo/domains/billing/hooks/useReceiptTableColumns'
import { useReceiptTableFilters } from '@condo/domains/billing/hooks/useReceiptTableFilters'
import { BillingReceiptForOrganization } from '@condo/domains/billing/utils/clientSchema'
import Input from '@condo/domains/common/components/antd/Input'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { Table, DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import {
    getPageIndexFromOffset,
    parseQuery,
} from '@condo/domains/common/utils/tables.utils'
import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'

import { useBillingAndAcquiringContexts } from './ContextProvider'

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

const SORTABLE_PROPERTIES = ['toPay']
const INPUT_STYLE: CSSProperties = { width: '18em' }

export const ReceiptsTable: React.FC = () => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const LoadingErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })

    const { billingContexts } = useBillingAndAcquiringContexts()
    const billingContext = billingContexts.length > 0 ? billingContexts[0] : null
    const currencyCode = get(billingContext, ['integration', 'currencyCode'], defaultCurrencyCode)
    const reportPeriod = get(billingContexts.find(({ lastReport }) => !!lastReport), ['lastReport', 'period'], null)
    const contextIds = billingContexts.map(({ id }) => id)
    const hasToPayDetails = get(billingContext, ['integration', 'dataFormat', 'hasToPayDetails'], false)
    const hasServices = get(billingContext, ['integration', 'dataFormat', 'hasServices'], false)
    const hasServicesDetails = get(billingContext, ['integration', 'dataFormat', 'hasServicesDetails'], false)

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const filtersFromQuery: Record<string, string | unknown> = useMemo(() => getFiltersFromQuery(router.query), [router.query])

    const [search, handleSearchChange] = useSearch()
    const filterMetas = useReceiptTableFilters(reportPeriod, search)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, SORTABLE_PROPERTIES)

    const onPeriodChange = useMemo(() => async (periodString) => {
        setPeriod(periodString)
        const newParameters = getFiltersQueryData({ ...filtersFromQuery, period: periodString ? dayjs(periodString).format( 'YYYY-MM-01') : null })
        await updateQuery(router, { newParameters }, { shallow: true, resetOldParameters: false })
    }, [router, filtersFromQuery])

    const {
        loading,
        count: total,
        objs: receipts,
        error,
        refetch,
    } = BillingReceiptForOrganization.useObjects({
        where: { ...filtersToWhere(filters), context: { id_in: contextIds } },
        sortBy: sortersToSortBy(sorters) as SortBillingReceiptsBy[],
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const { updateStepIfNotCompleted } = useTourContext()
    useDeepCompareEffect(() => {
        if (receipts.length > 0) {
            updateStepIfNotCompleted(TourStepTypeType.UploadReceipts)
        }
    }, [receipts])

    const mainTableColumns = useReceiptTableColumns(filterMetas, hasToPayDetails, currencyCode)

    const [modalIsVisible, setModalIsVisible] = useState(false)
    const [detailedReceipt, setDetailedReceipt] = useState<BillingReceiptType>(null)
    const [period, setPeriod] = useState(dayjs(reportPeriod, 'YYYY-MM-DD'))
    const showServiceModal = (receipt: BillingReceiptType) => {
        setModalIsVisible(true)
        setDetailedReceipt(receipt || null)
        return
    }
    const hideServiceModal = () => {
        setModalIsVisible(false)
    }
    
    useDeepCompareEffect(()=>{
        const filtersPeriod = get(filters, 'period')
        if (filtersPeriod) {
            setPeriod(dayjs(filtersPeriod as string))
        }
    }, [filters])

    useEffect(() => {
        const handleRedirect = async (event) => {
            if (get(event, 'type') === 'condo-bridge') refetch()
        }
        bridge.subscribe(handleRedirect)
        return () => {
            bridge.unsubscribe(handleRedirect)
        }
    }, [refetch])

    const periodMetaSelect = useMemo(() => {
        return (
            <Space direction='vertical' size={12}>
                <DatePicker
                    style={INPUT_STYLE}
                    value={period}
                    onChange={onPeriodChange}
                    picker='month'
                    format='MMMM YYYY'
                />
            </Space>
        )
    }, [period, onPeriodChange])

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
                <Col span={24}>
                    <Row gutter={[20, 20]}>
                        <Col xs={24} md={7}>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={(e) => {handleSearchChange(e.target.value)}}
                                value={search}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} md={8}>{periodMetaSelect}</Col>
                    </Row>
                </Col>
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
                onCancel={hideServiceModal}
                isDetailed={hasServicesDetails}
                currencyCode={currencyCode}
            />
        </>
    )
}

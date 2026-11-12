import { Payment as PaymentType, PaymentStatusType, PaymentWhereInput, SortPaymentsBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, FullTableState, GetTableData, Modal, Space, Table, TableRef, Tour, Typography } from '@open-condo/ui'

import { usePaymentsFilters } from '@condo/domains/acquiring/components/payments/PaymentsFiltersContext'
import { PaymentsSummary } from '@condo/domains/acquiring/components/payments/PaymentsSummary'
import styles from '@condo/domains/acquiring/components/payments/PaymentsTable.module.css'
import { EXPORT_PAYMENTS_TO_EXCEL, Payment as PaymentGQL } from '@condo/domains/acquiring/gql'
import usePaymentsSum from '@condo/domains/acquiring/hooks/usePaymentsSum'
import { usePaymentsTableColumns } from '@condo/domains/acquiring/hooks/usePaymentsTableColumns'
import { usePosIntegrationAlert } from '@condo/domains/acquiring/hooks/usePosIntegrationAlert'
import { usePosIntegrationLastTestingPosReceipt } from '@condo/domains/acquiring/hooks/usePosIntegrationLastTestingPosReceipt'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTableTranslations } from '@condo/domains/common/hooks/useTableTranslations'
import { defaultParseUrlQuery } from '@condo/domains/common/utils/tableUrls'


const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

const SORTABLE_PROPERTIES = ['advancedAt', 'depositedDate', 'amount']
const PAYMENTS_DEFAULT_SORT_BY = ['advancedAt_DESC']

const ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const ASC = 'ASC'
const DESC = 'DESC'

const getSortQueryValue = (sortState: FullTableState['sortState']): string | undefined => {
    if (!sortState?.length) return undefined

    const firstSort = sortState[0]
    return `${firstSort.id}_${firstSort.desc ? DESC : ASC}`
}

const setQueryParam = (
    query: Record<string, string | string[]>,
    key: string,
    value: string | undefined
): void => {
    if (value) {
        query[key] = value
        return
    }

    delete query[key]
}

interface PaymentsTableContentProps {
    areAlertLoading: boolean
}

const PaymentsTableContent: React.FC<PaymentsTableContentProps> = ({ areAlertLoading }): JSX.Element => {
    const intl = useIntl()
    const { lastTestingPosReceipt, loading: isLastTestingPosReceiptLoading, refetch: refetchLastTestingPosReceipt, b2bAppContext: posIntegrationContext } = usePosIntegrationLastTestingPosReceipt({
        skipUntilAuthenticated: areAlertLoading,
    })
    // Track if date range has been cleared for testing receipt to prevent the effect from running
    // multiple times and interfering with tab navigation (e.g., switching to accruals tab)
    const hasDateRangeBeenClearedRef = useRef(false)
    const tableRef = useRef<TableRef | null>(null)
    const ConfirmTitle = intl.formatMessage({ id: 'component.TicketWarningModal.ConfirmTitle' })
    const TotalsSumTitle = intl.formatMessage({ id: 'pages.condo.payments.TotalSum' })
    const DoneSumTitle = intl.formatMessage({ id: 'MultiPayment.status.DONE' })
    const WithdrawnSumTitle = intl.formatMessage({ id: 'MultiPayment.status.PROCESSING' })
    const PaymentsCountTitle = intl.formatMessage({ id: 'pages.condo.payments.summary.count' })
    const ExportPaymentsTitle = intl.formatMessage({ id: 'pages.billing.payments.exportToExcel.title' })

    const { billingContexts, acquiringContexts } = useBillingAndAcquiringContexts()
    const billingContext = billingContexts[0]

    const { breakpoints } = useLayoutContext()
    const router = useRouter()
    const userOrganization = useOrganization()
    const currentTab = router.query.tab

    const currencyCode = get(billingContext, ['integration', 'currencyCode'], defaultCurrencyCode)

    const [isStatusDescModalVisible, setIsStatusDescModalVisible] = useState<boolean>(false)
    const [titleStatusDescModal, setTitleStatusDescModal] = useState('')
    const [textStatusDescModal, setTextStatusDescModal] = useState('')
    const [paymentsCount, setPaymentsCount] = useState(0)
    const [paymentsLoading, setPaymentsLoading] = useState(true)
    const openStatusDescModal = useCallback((statusType) => {
        const titleModal = intl.formatMessage({ id: 'payment.status.description.title.' + statusType as FormatjsIntl.Message['ids'] })
        const textModal = intl.formatMessage({ id: 'payment.status.description.text.' + statusType as FormatjsIntl.Message['ids'] })

        setTitleStatusDescModal(titleModal)
        setTextStatusDescModal(textModal)
        setIsStatusDescModalVisible(true)
    }, [intl])

    const columnLabels = useTableTranslations()

    useEffect(() => {
        if (!areAlertLoading) {
            refetchLastTestingPosReceipt()
        }
    }, [areAlertLoading, refetchLastTestingPosReceipt])

    const organizationId = get(userOrganization, ['organization', 'id'], '')
    const { clearDateFilter, dateFilter, paymentFilterMetas: queryMetas, search } = usePaymentsFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers<PaymentWhereInput>(queryMetas, SORTABLE_PROPERTIES)
    const tableColumns = usePaymentsTableColumns(currencyCode, openStatusDescModal, {
        acquiringContexts,
        lastTestingPosReceipt,
        posIntegrationContext,
        search,
    })

    const parsedUrlState = useMemo(
        () => defaultParseUrlQuery(router.query as Record<string, string | string[]>, DEFAULT_PAGE_SIZE),
        [router.query]
    )
    const initialTableState = useMemo<FullTableState>(() => ({
        ...parsedUrlState,
        filterState: {},
        globalFilter: undefined,
        rowSelectionState: [],
    // Table reads initial state only once. URL changes are handled through its API and data source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [])

    const searchPaymentsQuery: PaymentWhereInput = useMemo(() => ({
        ...filtersToWhere({ depositedDate: dateFilter, ...parsedUrlState.filterState, search }),
        organization: { id: organizationId },
        status_in: [PaymentStatusType.Withdrawn, PaymentStatusType.Done],
        invoice_is_null: true,
    }), [dateFilter, filtersToWhere, organizationId, parsedUrlState.filterState, search])
    const searchPaymentsQueryRef = useRef(searchPaymentsQuery)
    searchPaymentsQueryRef.current = searchPaymentsQuery
    const lastTestingPosReceiptRef = useRef(lastTestingPosReceipt)
    lastTestingPosReceiptRef.current = lastTestingPosReceipt
    const filtersKey = JSON.stringify(searchPaymentsQuery)
    const previousFiltersKeyRef = useRef(filtersKey)

    const [fetchPayments] = useLazyQuery(PaymentGQL.GET_ALL_OBJS_WITH_COUNT_QUERY)
    const dataSource: GetTableData<PaymentType> = useCallback(async ({ sortState, startRow, endRow }) => {
        setPaymentsLoading(true)
        try {
            const sortBy = sortersToSortBy(sortState, PAYMENTS_DEFAULT_SORT_BY) as SortPaymentsBy[]
            const { data } = await fetchPayments({
                variables: {
                    where: searchPaymentsQueryRef.current,
                    sortBy,
                    first: endRow - startRow,
                    skip: startRow,
                },
                fetchPolicy: 'network-only',
            })
            const rowData: PaymentType[] = data?.objs?.filter(Boolean) ?? []
            const rowCount = data?.meta?.count ?? 0

            if (lastTestingPosReceiptRef.current) {
                const highlightedIndex = rowData.findIndex(payment => payment.id === lastTestingPosReceiptRef.current.condoPaymentId)
                if (highlightedIndex > 0) {
                    const [highlightedRow] = rowData.splice(highlightedIndex, 1)
                    rowData.unshift(highlightedRow)
                }
            }

            setPaymentsCount(rowCount)
            return { rowData, rowCount }
        } catch (error) {
            console.error('Failed to fetch payments', error)
            setPaymentsCount(0)
            return { rowData: [], rowCount: 0 }
        } finally {
            setPaymentsLoading(false)
        }
    }, [fetchPayments, sortersToSortBy])

    const updateUrlQuery = useCallback((params: FullTableState) => {
        const nextQuery = { ...router.query } as Record<string, string | string[]>
        const nextOffset = params.startRow > 0 ? String(params.startRow) : undefined

        setQueryParam(nextQuery, 'offset', nextOffset)
        setQueryParam(nextQuery, 'sort', getSortQueryValue(params.sortState))
        delete nextQuery.selectedRows

        if (isEqual(router.query, nextQuery)) return
        router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true }).catch((error) => {
            console.error('Failed to update payments table query params', error)
        })
    }, [router])

    useEffect(() => {
        if (previousFiltersKeyRef.current === filtersKey || !tableRef.current) return
        previousFiltersKeyRef.current = filtersKey

        const { startRow } = tableRef.current.api.getPagination()
        if (startRow > 0) {
            tableRef.current.api.setPagination({ startRow: 0, endRow: DEFAULT_PAGE_SIZE })
        } else {
            tableRef.current.api.refetchData()
        }
    }, [filtersKey])

    useEffect(() => {
        if (lastTestingPosReceipt && !isLastTestingPosReceiptLoading && currentTab === 'payments' && !hasDateRangeBeenClearedRef.current) {
            hasDateRangeBeenClearedRef.current = true
            clearDateFilter()
        } else if (currentTab !== 'payments') {
            // Reset flag when leaving the tab so it can be cleared again on return
            hasDateRangeBeenClearedRef.current = false
        }
    }, [clearDateFilter, currentTab, isLastTestingPosReceiptLoading, lastTestingPosReceipt])

    const currentSortBy = sortersToSortBy(parsedUrlState.sortState, PAYMENTS_DEFAULT_SORT_BY)
    const { data: sumDonePayments, loading: donePaymentsLoading } = usePaymentsSum({ paymentsWhere: { ...searchPaymentsQuery, status: PaymentStatusType.Done } })
    const { data: sumWithdrawnPayments, loading: withdrawnPaymentsLoading } = usePaymentsSum({ paymentsWhere: { ...searchPaymentsQuery, status: PaymentStatusType.Withdrawn } })
    const { data: sumAllPayments, loading: allPaymentsLoading } = usePaymentsSum({ paymentsWhere: searchPaymentsQuery })

    const paymentsSummaryItems = useMemo(() => ([
        {
            key: 'total',
            label: TotalsSumTitle,
            value: getMoneyRender(intl, currencyCode)(sumAllPayments?.result?.sum),
            loading: allPaymentsLoading,
        },
        {
            key: 'done',
            label: DoneSumTitle,
            value: getMoneyRender(intl, currencyCode)(sumDonePayments?.result?.sum),
            loading: donePaymentsLoading,
            type: 'success' as const,
        },
        {
            key: 'withdrawn',
            label: WithdrawnSumTitle,
            value: getMoneyRender(intl, currencyCode)(sumWithdrawnPayments?.result?.sum),
            loading: withdrawnPaymentsLoading,
            type: 'warning' as const,
        },
        {
            key: 'count',
            label: PaymentsCountTitle,
            value: paymentsCount,
            loading: paymentsLoading,
        },
    ]), [TotalsSumTitle, intl, currencyCode, sumAllPayments?.result?.sum, allPaymentsLoading, DoneSumTitle, sumDonePayments?.result?.sum, donePaymentsLoading, WithdrawnSumTitle, sumWithdrawnPayments?.result?.sum, withdrawnPaymentsLoading, PaymentsCountTitle, paymentsCount, paymentsLoading])

    const getRowId = useCallback((payment: PaymentType) => payment.id, [])
    const getRowClassName = useCallback((payment: PaymentType) => {
        return lastTestingPosReceipt?.condoPaymentId === payment.id ? styles.testingPaymentRow : undefined
    }, [lastTestingPosReceipt])

    return (
        <Tour.Provider>
            <Row gutter={ROW_GUTTER} align='middle' justify='center'>
                <Col span={24}>
                    <Space size={8} direction='vertical' width='100%'>
                        <PaymentsSummary items={paymentsSummaryItems} />
                        <Table<PaymentType>
                            id='payments-table'
                            dataSource={dataSource}
                            columns={tableColumns}
                            pageSize={DEFAULT_PAGE_SIZE}
                            onTableStateChange={updateUrlQuery}
                            initialTableState={initialTableState}
                            columnLabels={columnLabels}
                            getRowId={getRowId}
                            getRowClassName={getRowClassName}
                            ref={tableRef}
                        />
                    </Space>
                </Col>
                <Col span={24}>
                    <ExportToExcelActionBar
                        hidden={!breakpoints.TABLET_LARGE}
                        searchObjectsQuery={searchPaymentsQuery}
                        sortBy={currentSortBy}
                        exportToExcelQuery={EXPORT_PAYMENTS_TO_EXCEL}
                        disabled={paymentsCount < 1}
                        label={ExportPaymentsTitle}
                        buttonType='primary'
                    />
                </Col>
            </Row>

            <Modal
                open={isStatusDescModalVisible}
                onCancel={() => setIsStatusDescModalVisible(false)}
                title={titleStatusDescModal}
                footer={[
                    <Button
                        key='close'
                        type='primary'
                        onClick={() => setIsStatusDescModalVisible(false)}
                    >
                        {ConfirmTitle}
                    </Button>,
                ]}
            >
                <Typography.Text type='secondary'>
                    {textStatusDescModal}
                </Typography.Text>
            </Modal>
        </Tour.Provider>
    )
}

const PaymentsTable: React.FC = (props) => {
    const { PosIntegrationAlert, loading: areAlertLoading } = usePosIntegrationAlert()

    return (
        <>
            {areAlertLoading && (
                <div className={styles.loaderContainer}>
                    <Loader size='large' fill/>
                </div>
            )}
            <Row gutter={ROW_GUTTER}>
                {PosIntegrationAlert && (
                    <Col span={24}>
                        {PosIntegrationAlert}
                    </Col>
                )}
                <Col span={24}>
                    <PaymentsTableContent areAlertLoading={areAlertLoading} {...props} />
                </Col>
            </Row>
        </>
    )
}

export default PaymentsTable

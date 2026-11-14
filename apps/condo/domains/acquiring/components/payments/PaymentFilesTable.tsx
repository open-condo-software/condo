import { GetPaymentsFilesQuery, useGetPaymentsFilesLazyQuery } from '@app/condo/gql'
import { PaymentsFileWhereInput, SortPaymentsFilesBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import { Gutter } from 'antd/lib/grid/row'
import isEqual from 'lodash/isEqual'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { Download } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import {
    ActionBar,
    Button,
    FullTableState,
    GetTableData,
    RowSelectionState,
    Space,
    Table,
    TableRef,
} from '@open-condo/ui'

import { PaymentsFileDetailsModal } from '@condo/domains/acquiring/components/payments/PaymentsFileDetailsModal'
import { usePaymentsFilters } from '@condo/domains/acquiring/components/payments/PaymentsFiltersContext'
import { PaymentsSummary } from '@condo/domains/acquiring/components/payments/PaymentsSummary'
import useDownloadPaymentsFiles from '@condo/domains/acquiring/hooks/useDownloadPaymentsFiles'
import { usePaymentsFilesTableColumns } from '@condo/domains/acquiring/hooks/usePaymentsFilesTableColumns'
import usePaymentsSum from '@condo/domains/acquiring/hooks/usePaymentsSum'
import { getInitialSelectedRegistryKeys } from '@condo/domains/acquiring/utils/helpers'
import {
    getPaymentColumnFilterState,
    mergePaymentColumnFilters,
} from '@condo/domains/acquiring/utils/paymentFilters'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTableTranslations } from '@condo/domains/common/hooks/useTableTranslations'
import { FiltersFromQueryType } from '@condo/domains/common/utils/tables.utils'
import { defaultParseUrlQuery } from '@condo/domains/common/utils/tableUrls'


const SORTABLE_PROPERTIES = ['amount', 'loadedAt', 'number', 'paymentPeriodStartDate', 'paymentsCount']
const SORTABLE_COLUMN_IDS = new Set(['amount', 'loadedAt', 'number', 'paymentPeriod', 'paymentsCount'])
const PAYMENTS_DEFAULT_SORT_BY = ['paymentPeriodStartDate_DESC']
const PAYMENTS_DEFAULT_SORT_STATE: FullTableState['sortState'] = [{ id: 'paymentPeriod', desc: true }]

const ROW_GUTTER: [Gutter, Gutter] = [0, 24]
const BOTTOM_PADDING_LIKE_ACTION_BAR: CSSProperties = { paddingBottom: '104px' }
const ASC = 'ASC'
const DESC = 'DESC'

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

type PaymentsFile = NonNullable<NonNullable<GetPaymentsFilesQuery['paymentsFiles']>[number]>

type PaymentsFileTableResult = {
    rowData: PaymentsFile[]
    rowCount: number
    error?: unknown
}

type PaymentsFileTableRequest = {
    promise: Promise<PaymentsFileTableResult>
}

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

const PaymentFilesTableContent: React.FC = (): JSX.Element => {
    const intl = useIntl()
    const TotalsSumTitle = intl.formatMessage({ id: 'pages.condo.payments.TotalSum' })
    const PaymentsCountTitle = intl.formatMessage({ id: 'pages.condo.payments.summary.count' })
    const CancelSelectedRegistryMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const DownloadRegistriesMessage = intl.formatMessage({ id: 'Download' })

    const { acquiringContexts, billingContexts } = useBillingAndAcquiringContexts()
    const { persistor } = useCachePersistor()

    const router = useRouter()
    const tableRef = useRef<TableRef | null>(null)

    const parsedUrlState = useMemo(
        () => defaultParseUrlQuery(router.query as Record<string, string | string[]>, DEFAULT_PAGE_SIZE),
        [router.query]
    )
    const legacySelectedRegistryKeys = useMemo(() => getInitialSelectedRegistryKeys(router), [router])
    const columnFilterState = useMemo(
        () => getPaymentColumnFilterState(parsedUrlState.filterState as FiltersFromQueryType, 'registry'),
        [parsedUrlState.filterState]
    )
    const filtersFromUrl = useMemo<FiltersFromQueryType>(() => ({
        ...parsedUrlState.filterState as FiltersFromQueryType,
        ...(parsedUrlState.globalFilter ? { search: parsedUrlState.globalFilter } : {}),
    }), [parsedUrlState.filterState, parsedUrlState.globalFilter])
    const sortStateFromUrl = useMemo(
        () => parsedUrlState.sortState.filter(({ id }) => SORTABLE_COLUMN_IDS.has(id)),
        [parsedUrlState.sortState]
    )
    const normalizedSortState = sortStateFromUrl.length ? sortStateFromUrl : PAYMENTS_DEFAULT_SORT_STATE
    const initialTableState = useMemo<FullTableState>(() => ({
        ...parsedUrlState,
        filterState: columnFilterState,
        globalFilter: undefined,
        sortState: normalizedSortState,
        rowSelectionState: parsedUrlState.rowSelectionState.length
            ? parsedUrlState.rowSelectionState
            : legacySelectedRegistryKeys,
    // Table reads initial state only once. URL changes are handled through its API and data source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [])

    const currencyCode = billingContexts.find(({ integration }) => !!integration.currencyCode)?.integration?.currencyCode ?? defaultCurrencyCode

    const columnLabels = useTableTranslations()
    const { paymentsFileFilterMetas: queryMetas, search } = usePaymentsFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers<PaymentsFileWhereInput>(queryMetas, SORTABLE_PROPERTIES)
    const [isFilesDownloading, setIsFilesDownloading] = useState(false)
    const [openedPaymentsFileId, setOpenedPaymentsFileId] = useState<string | null>(null)
    const [paymentsFiles, setPaymentsFiles] = useState<PaymentsFile[]>([])
    const [paymentsFilesCount, setPaymentsFilesCount] = useState(0)
    const [paymentsFilesLoading, setPaymentsFilesLoading] = useState(true)
    const [selectedRegistryKeys, setSelectedRegistryKeys] = useState<string[]>(initialTableState.rowSelectionState)
    const CountSelectedRegistryMessage = intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedRegistryKeys.length })

    const tableColumns = usePaymentsFilesTableColumns(currencyCode, {
        acquiringContexts,
        filterMetas: queryMetas,
        search,
    })

    const buildSearchPaymentsFilesQuery = useCallback((filterState: FiltersFromQueryType): PaymentsFileWhereInput => ({
        ...filtersToWhere(filterState),
        context: { id_in: acquiringContexts.map(({ id }) => id) },
    }), [acquiringContexts, filtersToWhere])
    const searchPaymentsFilesQuery = useMemo(
        () => buildSearchPaymentsFilesQuery(filtersFromUrl),
        [buildSearchPaymentsFilesQuery, filtersFromUrl]
    )
    const searchPaymentsFilesQueryRef = useRef(searchPaymentsFilesQuery)
    searchPaymentsFilesQueryRef.current = searchPaymentsFilesQuery
    const canFetchPaymentsFilesRef = useRef(Boolean(persistor && acquiringContexts.length))
    canFetchPaymentsFilesRef.current = Boolean(persistor && acquiringContexts.length)
    const filtersKey = JSON.stringify({ searchPaymentsFilesQuery, persistorReady: Boolean(persistor) })
    const previousFiltersKeyRef = useRef(filtersKey)
    const previousColumnFilterStateRef = useRef(columnFilterState)
    const latestRequestRef = useRef<PaymentsFileTableRequest | null>(null)

    const [fetchPaymentsFiles] = useGetPaymentsFilesLazyQuery()
    const waitForLatestRequest = useCallback(async (): Promise<PaymentsFileTableResult> => {
        while (latestRequestRef.current) {
            const latestRequest = latestRequestRef.current
            const result = await latestRequest.promise
            if (latestRequest === latestRequestRef.current) return result
        }

        return { rowData: [], rowCount: 0 }
    }, [])

    const dataSource: GetTableData<PaymentsFile> = useCallback(async ({ sortState, startRow, endRow }) => {
        const request: PaymentsFileTableRequest = {
            promise: (async () => {
                if (!canFetchPaymentsFilesRef.current) return { rowData: [], rowCount: 0 }

                try {
                    const querySortState = sortState.map(sort => (
                        sort.id === 'paymentPeriod' ? { ...sort, id: 'paymentPeriodStartDate' } : sort
                    ))
                    const sortBy = sortersToSortBy(querySortState, PAYMENTS_DEFAULT_SORT_BY) as SortPaymentsFilesBy[]
                    const { data } = await fetchPaymentsFiles({
                        variables: {
                            where: searchPaymentsFilesQueryRef.current,
                            sortBy,
                            first: endRow - startRow,
                            skip: startRow,
                        },
                        fetchPolicy: 'network-only',
                    })
                    const rowData = data?.paymentsFiles?.filter(Boolean) || []
                    const rowCount = data?.meta?.count ?? 0
                    return { rowData, rowCount }
                } catch (error) {
                    return { rowData: [], rowCount: 0, error }
                }
            })(),
        }

        latestRequestRef.current = request
        setPaymentsFilesLoading(true)

        const result = await waitForLatestRequest()
        if (request === latestRequestRef.current) {
            if (result.error) {
                console.error('Failed to fetch payments files', result.error)
            }
            setPaymentsFiles(result.rowData)
            setPaymentsFilesCount(result.rowCount)
            setPaymentsFilesLoading(false)
        }

        return { rowData: result.rowData, rowCount: result.rowCount }
    }, [fetchPaymentsFiles, sortersToSortBy, waitForLatestRequest])

    const openedPaymentsFile = useMemo(
        () => paymentsFiles.find(({ id }) => id === openedPaymentsFileId) || null,
        [openedPaymentsFileId, paymentsFiles]
    )

    const refetchPaymentsFiles = useCallback(async () => {
        await tableRef.current?.api?.refetchData()
    }, [])
    const { downloadPaymentsFiles } = useDownloadPaymentsFiles(refetchPaymentsFiles)

    const { data: sumAllPayments, loading: sumAllPaymentsLoading } = usePaymentsSum({ paymentsFilesWhere: searchPaymentsFilesQuery })

    useEffect(() => {
        if (previousFiltersKeyRef.current === filtersKey || !tableRef.current) return
        previousFiltersKeyRef.current = filtersKey

        const haveColumnFiltersChanged = !isEqual(previousColumnFilterStateRef.current, columnFilterState)
        previousColumnFilterStateRef.current = columnFilterState
        if (haveColumnFiltersChanged) return

        const { startRow } = tableRef.current.api.getPagination()
        if (startRow > 0) {
            tableRef.current.api.setPagination({ startRow: 0, endRow: DEFAULT_PAGE_SIZE })
        } else {
            tableRef.current.api.refetchData()
        }
    }, [columnFilterState, filtersKey])

    const handleResetSelectedRegistry = useCallback(() => {
        tableRef.current?.api?.resetRowSelection()
        setSelectedRegistryKeys([])
    }, [])

    const handleClosePaymentsFileModal = useCallback(() => {
        setOpenedPaymentsFileId(null)
    }, [])

    const handleDownloadPaymentsFile = useCallback(async (fileId: string) => {
        await downloadPaymentsFiles([fileId])
    }, [downloadPaymentsFiles])

    const handleDownloadClick = async () => {
        setIsFilesDownloading(true)
        await downloadPaymentsFiles(selectedRegistryKeys)
        handleResetSelectedRegistry()
        setIsFilesDownloading(false)
    }

    const updateUrlQuery = useCallback((params: FullTableState) => {
        const nextQuery = { ...router.query } as Record<string, string | string[]>
        const nextOffset = params.startRow > 0 ? String(params.startRow) : undefined
        const nextFilters = mergePaymentColumnFilters(
            filtersFromUrl,
            params.filterState as FiltersFromQueryType,
            'registry'
        )
        const nextFiltersValue = Object.keys(nextFilters).length ? JSON.stringify(nextFilters) : undefined
        const nextSelectedRows = params.rowSelectionState.length
            ? JSON.stringify(params.rowSelectionState)
            : undefined

        searchPaymentsFilesQueryRef.current = buildSearchPaymentsFilesQuery(nextFilters)

        setQueryParam(nextQuery, 'offset', nextOffset)
        setQueryParam(nextQuery, 'filters', nextFiltersValue)
        setQueryParam(nextQuery, 'sort', getSortQueryValue(params.sortState))
        setQueryParam(nextQuery, 'selectedRows', nextSelectedRows)
        delete nextQuery.selectedRegistryIds

        if (isEqual(router.query, nextQuery)) return
        router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: true }).catch((error) => {
            console.error('Failed to update payments files table query params', error)
        })
    }, [buildSearchPaymentsFilesQuery, filtersFromUrl, router])

    useEffect(() => {
        if (!tableRef.current) return

        const { api } = tableRef.current
        const currentColumnFilterState = api.getFilterState()
        if (!isEqual(currentColumnFilterState, columnFilterState)) {
            api.setFilterState(columnFilterState)
        }

        if (!isEqual(api.getSorting(), normalizedSortState)) {
            api.setSorting(normalizedSortState)
        }

        const { startRow } = api.getPagination()
        if (startRow !== parsedUrlState.startRow) {
            api.setPagination({
                startRow: parsedUrlState.startRow,
                endRow: parsedUrlState.startRow + DEFAULT_PAGE_SIZE,
            })
        }
    }, [columnFilterState, normalizedSortState, parsedUrlState.startRow])

    const onRowSelectionChange = useCallback((rowSelectionState: RowSelectionState) => {
        setSelectedRegistryKeys(rowSelectionState)
    }, [])
    const rowSelectionOptions = useMemo(() => ({
        enableRowSelection: true,
        onRowSelectionChange,
    }), [onRowSelectionChange])

    const handlePaymentsFileRowClick = useCallback((record: PaymentsFile) => {
        const hasSelectedText = globalThis.window?.getSelection?.()?.toString().trim()
        if (hasSelectedText) return

        setOpenedPaymentsFileId(record.id)
    }, [])

    const paymentsSummaryItems = useMemo(() => ([
        {
            key: 'total',
            label: TotalsSumTitle,
            value: getMoneyRender(intl, currencyCode)(sumAllPayments?.result?.sum),
            loading: sumAllPaymentsLoading,
        },
        {
            key: 'count',
            label: PaymentsCountTitle,
            value: sumAllPayments?.result?.paymentsCount ?? 0,
            loading: sumAllPaymentsLoading,
        },
    ]), [PaymentsCountTitle, TotalsSumTitle, currencyCode, intl, sumAllPayments?.result?.paymentsCount, sumAllPayments?.result?.sum, sumAllPaymentsLoading])

    const getRowId = useCallback((paymentsFile: PaymentsFile) => paymentsFile.id, [])

    return (
        <Row gutter={ROW_GUTTER} align='middle' justify='center'>
            <Col span={24}>
                <Space size={8} direction='vertical' width='100%'>
                    <PaymentsSummary items={paymentsSummaryItems} />
                    <Table<PaymentsFile>
                        id='payments-files-table'
                        storageKey='payments-files-table-settings-v6'
                        dataSource={dataSource}
                        columns={tableColumns}
                        pageSize={DEFAULT_PAGE_SIZE}
                        onTableStateChange={updateUrlQuery}
                        initialTableState={initialTableState}
                        columnLabels={columnLabels}
                        rowSelectionOptions={rowSelectionOptions}
                        getRowId={getRowId}
                        onRowClick={handlePaymentsFileRowClick}
                        ref={tableRef}
                    />
                </Space>
            </Col>
            <Col span={24}>
                {!paymentsFilesLoading && paymentsFilesCount > 0 && selectedRegistryKeys.length > 0 && (
                    <ActionBar
                        message={CountSelectedRegistryMessage}
                        actions={[
                            <Button
                                key='create'
                                type='primary'
                                loading={isFilesDownloading}
                                icon={<Download size='medium' />}
                                onClick={handleDownloadClick}
                            >
                                {DownloadRegistriesMessage}
                            </Button>,
                            <Button
                                key='cancelPaymentsFileSelection'
                                type='secondary'
                                children={CancelSelectedRegistryMessage}
                                onClick={handleResetSelectedRegistry}
                                loading={isFilesDownloading}
                            />,
                        ]}
                    />
                )}
            </Col>
            <Col style={BOTTOM_PADDING_LIKE_ACTION_BAR}></Col>
            <PaymentsFileDetailsModal
                open={Boolean(openedPaymentsFile)}
                onClose={handleClosePaymentsFileModal}
                onDownload={handleDownloadPaymentsFile}
                paymentsFile={openedPaymentsFile}
                currency={currencyCode}
            />
        </Row>
    )
}

const PaymentFilesTable = () => {
    return <PaymentFilesTableContent />
}

export default PaymentFilesTable

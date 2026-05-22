import { BillingReceipt as BillingReceiptType, BillingReceiptWhereInput, SortBillingReceiptsBy, TourStepTypeType } from '@app/condo/schema'
import { Col, Row, Space, type RowProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isEqual from 'lodash/isEqual'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import bridge from '@open-condo/bridge'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import {
    ActionBar,
    ActionBarProps,
    Button,
    FullTableState,
    GetTableData,
    Input,
    RowSelectionState,
    Table,
    TableRef,
} from '@open-condo/ui'

import { ServicesModal } from '@condo/domains/billing/components/BillingPageContent/ServicesModal'
import { BillingReceiptForOrganization as BillingReceiptForOrganizationGQL } from '@condo/domains/billing/gql'
import { useReceiptTableColumns } from '@condo/domains/billing/hooks/useReceiptTableColumns'
import { useReceiptTableFilters } from '@condo/domains/billing/hooks/useReceiptTableFilters'
import { BillingReceiptForOrganization } from '@condo/domains/billing/utils/clientSchema'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import { DEFAULT_PAGE_SIZE } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useTableSearch } from '@condo/domains/common/hooks/useSearch'
import { useTableTranslations } from '@condo/domains/common/hooks/useTableTranslations'
import { defaultParseUrlQuery } from '@condo/domains/common/utils/tableUrls'
import { useTourContext } from '@condo/domains/onboarding/contexts/TourContext'

import { useBillingAndAcquiringContexts } from './ContextProvider'

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

const SORTABLE_PROPERTIES = ['toPay']
const INPUT_STYLE: CSSProperties = { width: '18em' }
const ITEMS_GUTTER: RowProps['gutter'] = [0, 24]
const FILTERS_GUTTER: RowProps['gutter'] = [16, 20]
const ASC = 'ASC'
const DESC = 'DESC'

const getSortQueryValue = (sortState: FullTableState['sortState']): string | undefined => {
    if (!sortState?.length) return undefined

    const firstSort = sortState[0]
    const sortOrder = firstSort.desc ? DESC : ASC
    return `${firstSort.id}_${sortOrder}`
}

const getFiltersWithGlobalSearch = (filterState: FullTableState['filterState'], globalFilter?: string): FullTableState['filterState'] => {
    const nextFilters = { ...filterState }

    if (globalFilter && globalFilter.trim() !== '') {
        nextFilters.search = globalFilter
    } else {
        delete nextFilters.search
    }

    return nextFilters
}

const setQueryParam = (query: Record<string, string | string[]>, key: string, value: string | undefined): void => {
    if (value) {
        query[key] = value
        return
    }

    delete query[key]
}

const buildNextTableQuery = (
    currentQuery: Record<string, string | string[]>,
    params: FullTableState
): Record<string, string | string[]> => {
    const { startRow, filterState, sortState, rowSelectionState, globalFilter } = params
    const nextFilters = getFiltersWithGlobalSearch(filterState, globalFilter)
    const nextQuery = { ...currentQuery }

    const nextOffset = startRow > 0 ? String(startRow) : undefined
    const nextFiltersValue = Object.keys(nextFilters).length > 0 ? JSON.stringify(nextFilters) : undefined
    const nextSortValue = getSortQueryValue(sortState)
    const nextSelectedRows = rowSelectionState?.length > 0 ? JSON.stringify(rowSelectionState) : undefined

    setQueryParam(nextQuery, 'offset', nextOffset)
    setQueryParam(nextQuery, 'filters', nextFiltersValue)
    setQueryParam(nextQuery, 'sort', nextSortValue)
    setQueryParam(nextQuery, 'selectedRows', nextSelectedRows)

    return nextQuery
}

export const ReceiptsTable: React.FC = () => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CancelSelectionMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })
    const ImpossibleToRestoreMessage = intl.formatMessage({ id: 'global.ImpossibleToRestore' })

    const userOrganization = useOrganization()
    const { billingContexts } = useBillingAndAcquiringContexts()
    const billingContext = billingContexts.length > 0 ? billingContexts[0] : null
    const currencyCode = get(billingContext, ['integration', 'currencyCode'], defaultCurrencyCode)
    const reportPeriod = get(billingContexts.find(({ lastReport }) => !!lastReport), ['lastReport', 'period'], null)
    const contextIds = useMemo(
        () => billingContexts.map(({ id }) => id).sort((a, b) => a.localeCompare(b)),
        [billingContexts]
    )
    const hasToPayDetails = get(billingContext, ['integration', 'dataFormat', 'hasToPayDetails'], false)
    const hasServices = get(billingContext, ['integration', 'dataFormat', 'hasServices'], false)
    const hasServicesDetails = get(billingContext, ['integration', 'dataFormat', 'hasServicesDetails'], false)
    const canManageReceipts =  get(userOrganization, ['link', 'role', 'canImportBillingReceipts'], false)

    const router = useRouter()
    const tableRef = useRef<TableRef | null>(null)
    const [search, handleSearchChange, setSearch] = useTableSearch(tableRef)
    const [selectedRowsCount, setSelectedRowsCount] = useState<number>(0)
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([])
    const [period, setPeriod] = useState<Dayjs | null>(() => reportPeriod ? dayjs(reportPeriod, 'YYYY-MM-DD') : null)

    const filterMetas = useReceiptTableFilters(reportPeriod, search, contextIds)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers<BillingReceiptWhereInput>(filterMetas, SORTABLE_PROPERTIES)
    const mainTableColumns = useReceiptTableColumns(filterMetas, hasToPayDetails, currencyCode)
    const columnLabels = useTableTranslations()
    const initialTableState = useMemo(() => defaultParseUrlQuery(router.query, DEFAULT_PAGE_SIZE), [router.query])
    const updateUrlQuery = useCallback((params: FullTableState) => {
        const nextQuery = buildNextTableQuery(router.query as Record<string, string | string[]>, params)
        if (isEqual(router.query, nextQuery)) return

        router.replace({
            pathname: router.pathname,
            query: nextQuery,
        }, undefined, { shallow: true }).catch((error) => {
            console.error('Failed to update billing receipts table query params', error)
        })
    }, [router])

    const { updateStepIfNotCompleted } = useTourContext()
    const [fetchReceipts] = useLazyQuery(BillingReceiptForOrganizationGQL.GET_ALL_OBJS_WITH_COUNT_QUERY)
    const updateReceipt = BillingReceiptForOrganization.useUpdate({})

    const [modalIsVisible, setModalIsVisible] = useState(false)
    const [detailedReceipt, setDetailedReceipt] = useState<BillingReceiptType>(null)

    const showServiceModal = useCallback((receipt: BillingReceiptType) => {
        setModalIsVisible(true)
        setDetailedReceipt(receipt || null)
    }, [])

    const hideServiceModal = useCallback(() => {
        setModalIsVisible(false)
    }, [])

    const onPeriodChange = useCallback((value: Dayjs | null, dateString: string) => {
        setPeriod(value)

        const currentFilterState = tableRef.current?.api?.getFilterState() || {}
        const nextFilterState = { ...currentFilterState }
        if (value && dateString) {
            nextFilterState.period = value.startOf('month').format('YYYY-MM-01')
        } else {
            nextFilterState.period = reportPeriod || undefined
        }
        tableRef.current?.api?.setFilterState(nextFilterState)
    }, [reportPeriod])

    const onRowClick = useCallback((record: BillingReceiptType) => {
        const hasSelectedText =  globalThis.window?.getSelection?.()?.toString().trim()
        if (hasSelectedText) return

        if (hasServices) {
            showServiceModal(record)
        }
    }, [hasServices, showServiceModal])

    const dataSource: GetTableData<BillingReceiptType> = useCallback(async ({
        filterState,
        sortState,
        startRow,
        endRow,
        globalFilter,
    }) => {
        const sortBy = sortersToSortBy(sortState) as SortBillingReceiptsBy[]
        const where = {
            ...filtersToWhere({
                ...filterState,
                search: globalFilter,
            }),
            context: { id_in: contextIds },
        }
        try {
            const { data } = await fetchReceipts({
                variables: {
                    where,
                    sortBy,
                    first: endRow - startRow,
                    skip: startRow,
                },
                fetchPolicy: 'network-only',
            })

            const rowData: BillingReceiptType[] = data?.objs?.filter(Boolean) ?? []
            const rowCount = data?.meta?.count ?? 0

            if (rowData.length > 0) {
                updateStepIfNotCompleted(TourStepTypeType.UploadReceipts)
            }

            return {
                rowData,
                rowCount,
            }
        } catch (error) {
            console.error('Failed to fetch billing receipts', error)
            return {
                rowData: [],
                rowCount: 0,
            }
        }
    }, [contextIds, fetchReceipts, filtersToWhere, sortersToSortBy, updateStepIfNotCompleted])

    const softDeleteSelectedReceipts = useCallback(async () => {
        if (!selectedRowIds.length) return

        const deletedAt = new Date().toISOString()

        for (const id of selectedRowIds) {
            await updateReceipt({ deletedAt }, { id })
        }

        tableRef.current?.api?.resetRowSelection()
        setSelectedRowsCount(0)
        setSelectedRowIds([])
        tableRef.current?.api?.setPagination({ startRow: 0, endRow: DEFAULT_PAGE_SIZE })
        await tableRef.current?.api?.refetchData()
    }, [selectedRowIds, updateReceipt])

    const selectedReceiptsActionBarButtons: ActionBarProps['actions'] = useMemo(() => [
        <DeleteButtonWithConfirmModal
            key='deleteSelectedReceipts'
            title={DeleteMessage}
            message={ImpossibleToRestoreMessage}
            okButtonLabel={DeleteMessage}
            action={softDeleteSelectedReceipts}
            buttonContent={DeleteMessage}
            buttonCustomProps={{ id: 'staffDeleteBillingReceipts', type: 'secondary' }}
            cancelMessage={DontDeleteMessage}
            showCancelButton
            cancelButtonType='primary'
        />,
        <Button
            key='cancelReceiptSelection'
            type='secondary'
            onClick={() => {
                tableRef.current?.api?.resetRowSelection()
                setSelectedRowsCount(0)
                setSelectedRowIds([])
            }}
        >
            {CancelSelectionMessage}
        </Button>,
    ], [
        CancelSelectionMessage,
        DeleteMessage,
        DontDeleteMessage,
        ImpossibleToRestoreMessage,
        softDeleteSelectedReceipts,
    ])

    const rowSelectionOptions = useMemo(() => ({
        enableRowSelection: canManageReceipts,
        onRowSelectionChange: (rowSelectionState: RowSelectionState) => {
            setSelectedRowsCount(rowSelectionState.length)
            setSelectedRowIds(rowSelectionState)
        },
    }), [canManageReceipts])

    const getRowId = useCallback((row: BillingReceiptType) => row.id, [])
    const onTableReady = useCallback((nextTableRef: TableRef) => {
        const tableSearch = nextTableRef.api.getGlobalFilter()
        setSearch(String(tableSearch || ''))
        setSelectedRowsCount(initialTableState.rowSelectionState.length)
        setSelectedRowIds(initialTableState.rowSelectionState)

        const tablePeriod = get(nextTableRef.api.getFilterState(), 'period')
        let nextPeriod: Dayjs | null = null
        if (tablePeriod) {
            nextPeriod = dayjs(String(tablePeriod), 'YYYY-MM-DD')
        } else if (reportPeriod) {
            nextPeriod = dayjs(reportPeriod, 'YYYY-MM-DD')
        }
        setPeriod(nextPeriod)
    }, [initialTableState.rowSelectionState, reportPeriod, setSearch])

    useEffect(() => {
        const handleRedirect = async (event) => {
            if (get(event, 'type') === 'condo-bridge') {
                await tableRef.current?.api?.refetchData()
            }
        }
        bridge.subscribe(handleRedirect)
        return () => {
            bridge.unsubscribe(handleRedirect)
        }
    }, [])

    const SelectedItemsMessage = useMemo(() => {
        return intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedRowsCount })
    }, [intl, selectedRowsCount])

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
    }, [onPeriodChange, period])

    return (
        <>
            <Row gutter={ITEMS_GUTTER}>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row gutter={FILTERS_GUTTER}>
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
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    <Table<BillingReceiptType>
                        id='billing-receipts-table'
                        dataSource={dataSource}
                        columns={mainTableColumns}
                        pageSize={DEFAULT_PAGE_SIZE}
                        onTableStateChange={updateUrlQuery}
                        initialTableState={initialTableState}
                        columnLabels={columnLabels}
                        rowSelectionOptions={rowSelectionOptions}
                        getRowId={getRowId}
                        onTableReady={onTableReady}
                        onRowClick={onRowClick}
                        ref={tableRef}
                    />
                </Col>
                {canManageReceipts && selectedRowsCount > 0 && (
                    <Col span={24}>
                        <ActionBar
                            message={SelectedItemsMessage}
                            actions={selectedReceiptsActionBarButtons}
                        />
                    </Col>
                )}
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

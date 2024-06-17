import {
    SortMeterReadingsBy,
    MeterReadingWhereInput, MeterReading as IMeterReading,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { ColumnsType } from 'antd/lib/table'
import { TableRowSelection } from 'antd/lib/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import isString from 'lodash/isString'
import uniqBy from 'lodash/uniqBy'
import { NextRouter, useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { PlusCircle, Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { Loader } from '@condo/domains/common/components/Loader'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MetersImportWrapper } from '@condo/domains/meter/components/Import/Index'
import ActionBarForSingleMeter from '@condo/domains/meter/components/Meters/ActionBarForSingleMeter'
import { EXPORT_METER_READINGS_QUERY } from '@condo/domains/meter/gql'
import { useUpdateMeterModal } from '@condo/domains/meter/hooks/useUpdateMeterModal'
import {
    MeterReadingForOrganization,
    MeterReadingFilterTemplate,
    METER_TAB_TYPES,
} from '@condo/domains/meter/utils/clientSchema'


const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [0, 40]
const FILTERS_CONTAINER_GUTTER: RowProps['gutter'] = [16, 16]
const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { paddingLeft: 0 }
const QUICK_FILTERS_COL_STYLE: CSSProperties = { alignSelf: 'center' }

const SORTABLE_PROPERTIES = ['date', 'clientName', 'source']
const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs().subtract(1, 'week'), dayjs()]

type MetersTableContentProps = {
    filtersMeta: FiltersMeta<MeterReadingWhereInput>[]
    tableColumns: ColumnsType
    baseSearchQuery: MeterReadingWhereInput
    canManageMeterReadings: boolean
    sortableProperties?: string[]
    mutationErrorsToMessages?: Record<string, string>
    loading?: boolean
    meterId?: string
    archiveDate?: string
}

const getInitialSelectedReadingKeys = (router: NextRouter) => {
    if ('selectedReadingIds' in router.query && isString(router.query.selectedReadingIds)) {
        try {
            return JSON.parse(router.query.selectedReadingIds as string)
        } catch (error) {
            console.warn('Failed to parse property value "selectedReadingIds"', error)
            return []
        }
    }
    return []
}

const MeterReadingsTableContent: React.FC<MetersTableContentProps> = ({
    filtersMeta,
    tableColumns,
    baseSearchQuery,
    canManageMeterReadings,
    sortableProperties,
    loading,
    meterId,
    archiveDate,
}) => {
    const intl = useIntl()
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const StartDateMessage = intl.formatMessage({ id: 'pages.condo.meter.StartDate' })
    const EndDateMessage = intl.formatMessage({ id: 'pages.condo.meter.EndDate' })
    const CancelSelectedReadingsMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const CountSelectedReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading.CountSelectedReadings' })
    const DeleteMeterReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading.DeleteMeterReadings' })
    const DeleteMeterReadingsMessageWarn = intl.formatMessage({ id: 'pages.condo.meter.MeterReading.DeleteMeterReadings.Warn' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })

    const router = useRouter()
    const { filters, offset, sorters, tab } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, sortableProperties || SORTABLE_PROPERTIES)

    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortMeterReadingsBy[], [sorters, sortersToSortBy])
    const { getTrackingWrappedCallback } = useTracking()

    const [dateRange, setDateRange] = useDateRangeSearch('date')
    const [filtersAreReset, setFiltersAreReset] = useState(false)
    const dateFallback = filtersAreReset ? null : DEFAULT_DATE_RANGE
    const dateFilterValue = dateRange || dateFallback
    const dateFilter = dateFilterValue ? dateFilterValue.map(el => el.toISOString()) : null

    const handleDateChange = useCallback((value) => {
        if (!value) {
            setFiltersAreReset(true)
        }
        setDateRange(value)
    }, [setDateRange])

    const searchMeterReadingsQuery = useMemo(() => ({
        ...filtersToWhere({ ... !meterId ? { date: dateFilter } : {}, ...filters }),
        ...baseSearchQuery,
    }), [baseSearchQuery, dateFilter, filters, filtersToWhere, meterId])

    const {
        loading: metersLoading,
        count: total,
        objs: meterReadings,
        refetch,
    } = MeterReadingForOrganization.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const [selectedReadingKeys, setSelectedReadingKeys] = useState<string[]>(() => getInitialSelectedReadingKeys(router))
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch)
    const { MultipleFiltersModal, ResetFiltersModalButton, OpenFiltersButton, appliedFiltersCount } = useMultipleFiltersModal({
        filterMetas: filtersMeta,
        filtersSchemaGql: MeterReadingFilterTemplate,
        onReset: handleSearchReset,
        extraQueryParameters: { tab },
    })

    const updateSelectedReadingKeys = useCallback((selectedReadingKeys: string[]) => {
        setSelectedReadingKeys(selectedReadingKeys)
    }, [])

    const processedMeterReadings = useMemo(() => {
        const filteredMeterReading = meterReadings.map(a => a).sort((a, b) => (a.date < b.date ? 1 : -1))
        return uniqBy(filteredMeterReading, (reading => get(reading, 'meter.id')))
    }, [meterReadings])

    const readingsToFilter = meterId ? meterReadings : processedMeterReadings

    const selectedRowKeysByPage = useMemo(() => {
        return readingsToFilter.filter(reading => selectedReadingKeys.includes(reading.id)).map(reading => reading.id)
    }, [readingsToFilter, selectedReadingKeys])

    const isSelectedAllRowsByPage = !metersLoading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length === readingsToFilter.length
    const isSelectedSomeRowsByPage = !metersLoading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length < readingsToFilter.length

    const handleResetSelectedReadings = useCallback(() => {
        setSelectedReadingKeys([])
    }, [])

    const softDeleteMeterReadings = MeterReadingForOrganization.useSoftDeleteMany(async () => {
        setSelectedReadingKeys([])
        refetch()
    })

    const handleDeleteButtonClick = useCallback(async () => {
        if (selectedReadingKeys.length) {
            const itemsToDeleteByChunks = chunk(selectedReadingKeys.map((key) => ({ id: key })), 30)
            for (const itemsToDelete of itemsToDeleteByChunks) {
                await softDeleteMeterReadings(itemsToDelete)
            }
        }
    }, [softDeleteMeterReadings, selectedReadingKeys])

    const handleSelectAllRowsByPage = useCallback((e: CheckboxChangeEvent) => {
        const checked = e.target.checked
        if (checked) {
            const newSelectedReadingKeys = readingsToFilter
                .filter(reading => !selectedRowKeysByPage.includes(reading.id))
                .map(reading => reading.id)
            updateSelectedReadingKeys([...selectedReadingKeys, ...newSelectedReadingKeys])
        } else {
            updateSelectedReadingKeys(selectedReadingKeys.filter(key => !selectedRowKeysByPage.includes(key)))
        }
    }, [readingsToFilter, updateSelectedReadingKeys, selectedReadingKeys, selectedRowKeysByPage])

    const handleSelectRow: (record: IMeterReading, checked: boolean) => void = useCallback((record, checked) => {
        const selectedKey = record.id
        if (checked) {
            updateSelectedReadingKeys([...selectedReadingKeys, selectedKey])
        } else {
            updateSelectedReadingKeys(selectedReadingKeys.filter(key => selectedKey !== key))
        }
    }, [selectedReadingKeys, updateSelectedReadingKeys])

    const handleSelectRowWithTracking = useMemo(
        () => getTrackingWrappedCallback('MeterReadingTableCheckboxSelectRow', null, handleSelectRow),
        [getTrackingWrappedCallback, handleSelectRow])

    const rowSelection: TableRowSelection<IMeterReading> = useMemo(() => ({
        selectedRowKeys: selectedRowKeysByPage,
        fixed: true,
        onSelect: handleSelectRowWithTracking,
        columnTitle: (
            <Checkbox
                checked={isSelectedAllRowsByPage}
                indeterminate={isSelectedSomeRowsByPage}
                onChange={handleSelectAllRowsByPage}
                eventName='MeterReadingsTableCheckboxSelectAll'
            />
        ),
    }), [handleSelectAllRowsByPage, handleSelectRowWithTracking, isSelectedAllRowsByPage, isSelectedSomeRowsByPage, selectedRowKeysByPage])

    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])
    const handleCreateMeterReadings = useCallback(() => router.push(`/meter/create?tab=${METER_TAB_TYPES.meterReading}`), [router])

    return (
        <>
            <Row
                gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                align='middle'
            >
                <Col span={24}>
                    {!meterId && (
                        <TableFiltersContainer>
                            <Row gutter={FILTERS_CONTAINER_GUTTER} align='middle' justify='space-between'>
                                <Col span={24}>
                                    <Input
                                        placeholder={SearchPlaceholder}
                                        onChange={handleSearch}
                                        value={search}
                                        allowClear
                                        suffix={<Search size='medium' color={colors.gray[7]}/>}
                                    />
                                </Col>
                                <Col>
                                    <Row justify='start' gutter={FILTERS_CONTAINER_GUTTER} style={{ flexWrap: 'nowrap' }}>
                                        <Col style={QUICK_FILTERS_COL_STYLE}>
                                            <DateRangePicker
                                                value={dateRange || dateFallback}
                                                onChange={handleDateChange}
                                                placeholder={[StartDateMessage, EndDateMessage]}
                                            />
                                        </Col>
                                    </Row>
                                </Col>
                                <Col>
                                    <Row gutter={[16, 10]} align='middle' style={{ flexWrap: 'nowrap' }}>
                                        {
                                            appliedFiltersCount > 0 && (
                                                <Col>
                                                    <ResetFiltersModalButton style={RESET_FILTERS_BUTTON_STYLE} />
                                                </Col>
                                            )
                                        }
                                        <Col>
                                            <OpenFiltersButton />
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </TableFiltersContainer>
                    )}
                </Col>
                <Col span={24}>
                    <Table
                        totalRows={total}
                        loading={metersLoading || loading}
                        dataSource={meterId ? meterReadings : processedMeterReadings}
                        columns={tableColumns}
                        rowSelection={rowSelection}
                        sticky
                    />
                </Col>
                {
                    !loading && total > 0 && (
                        <Col span={24}>
                            <ActionBar
                                message={selectedReadingKeys.length > 0 && `${CountSelectedReadingsMessage}: ${selectedReadingKeys.length}`}
                                actions={[
                                    selectedReadingKeys.length > 0 && (
                                        <>
                                            <DeleteButtonWithConfirmModal
                                                key='deleteSelectedReadings'
                                                title={DeleteMeterReadingsMessage}
                                                message={DeleteMeterReadingsMessageWarn}
                                                okButtonLabel={DeleteMessage}
                                                action={handleDeleteButtonClick}
                                                buttonContent={DeleteMessage}
                                                cancelMessage={DontDeleteMessage}
                                                showCancelButton
                                                cancelButtonType='primary'
                                            />
                                            <Button
                                                key='cancelReadingSelection'
                                                type='secondary'
                                                children={CancelSelectedReadingsMessage}
                                                onClick={handleResetSelectedReadings}
                                            />
                                        </>

                                    ),
                                ]}
                            />
                        </Col>
                    )
                }
                { selectedReadingKeys.length < 1 && !meterId && (
                    <Col span={24}>
                        <ExportToExcelActionBar
                            searchObjectsQuery={searchMeterReadingsQuery}
                            exportToExcelQuery={EXPORT_METER_READINGS_QUERY}
                            sortBy={sortBy}
                            actions={[
                                canManageMeterReadings && (
                                    <Button
                                        key='create'
                                        type='primary'
                                        icon={<PlusCircle size='medium' />}
                                        onClick={handleCreateMeterReadings}
                                    >
                                        {CreateMeterReadingsButtonLabel}
                                    </Button>
                                ),
                                canManageMeterReadings && !meterId && (
                                    <MetersImportWrapper
                                        key='import'
                                        accessCheck={canManageMeterReadings}
                                        onFinish={refetch}
                                    />
                                ),
                            ]}
                        />
                    </Col>
                )}
                {meterId && (
                    <Col span={24}>
                        <ActionBarForSingleMeter
                            canManageMeterReadings={canManageMeterReadings}
                            meterId={meterId}
                            meterType={METER_TAB_TYPES.meter}
                            archiveDate={archiveDate}
                        />
                    </Col>)
                }
            </Row>
            <UpdateMeterModal />
            <MultipleFiltersModal />
        </>
    )
}

type MeterReadingsPageContentProps = Omit<MetersTableContentProps, 'mutationErrorsToMessages'>

export const MeterReadingsPageContent: React.FC<MeterReadingsPageContentProps> = ({
    filtersMeta,
    tableColumns,
    baseSearchQuery,
    canManageMeterReadings,
    loading,
    meterId,
    archiveDate,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.manualCreateCard.body.description' })

    const { refetch } = MeterReadingForOrganization.useCount({}, { skip: true })
    const { count, loading: countLoading } = MeterReadingForOrganization.useCount({ where: baseSearchQuery })

    const PageContent = useMemo(() => {
        if (countLoading || loading) return <Loader />

        if (count === 0) {
            return (
                <>
                    {!meterId && (<EmptyListContent
                        label={EmptyListLabel}
                        importLayoutProps={{
                            manualCreateEmoji: EMOJI.CLOCK,
                            manualCreateDescription: EmptyListManualBodyDescription,
                            importCreateEmoji: EMOJI.LIST,
                            importWrapper: {
                                onFinish: refetch,
                                domainName: 'meterReading',
                            },
                            OverrideImportWrapperFC: MetersImportWrapper,
                        }}
                        createRoute={`/meter/create?tab=${METER_TAB_TYPES.meterReading}`}
                        accessCheck={canManageMeterReadings}
                    />)}
                    {meterId && (
                        <Col span={24}>
                            <ActionBarForSingleMeter
                                canManageMeterReadings={canManageMeterReadings}
                                meterId={meterId}
                                meterType={METER_TAB_TYPES.meter}
                            />
                        </Col>)
                    }
                </>

            )
        }

        return (
            <MeterReadingsTableContent
                filtersMeta={filtersMeta}
                tableColumns={tableColumns}
                baseSearchQuery={baseSearchQuery}
                canManageMeterReadings={canManageMeterReadings}
                loading={countLoading}
                meterId={meterId}
                archiveDate={archiveDate}
            />
        )
    }, [EmptyListLabel, EmptyListManualBodyDescription, archiveDate, baseSearchQuery, canManageMeterReadings, count, countLoading, filtersMeta, loading, meterId, refetch, tableColumns])

    return (
        <TablePageContent>
            {PageContent}
        </TablePageContent>
    )
}

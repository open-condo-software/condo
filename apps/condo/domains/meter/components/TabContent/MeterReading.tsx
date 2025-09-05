import {
    SortMeterReadingsBy,
    MeterReadingWhereInput, MeterReading as IMeterReading, PropertyMeter,
} from '@app/condo/schema'
import { Meter as MeterType, MeterResource as MeterResourceType } from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox/Checkbox'
import { TableRowSelection } from 'antd/lib/table/interface'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { Search } from '@open-condo/icons'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Checkbox, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MetersImportWrapper } from '@condo/domains/meter/components/Import/Index'
import { MeterReadingDatePicker } from '@condo/domains/meter/components/MeterReadingDatePicker'
import ActionBarForSingleMeter from '@condo/domains/meter/components/Meters/ActionBarForSingleMeter'
import UpdateMeterReadingModal from '@condo/domains/meter/components/Meters/UpdateMeterReadingModal'
import { useMeterReadingExportToExcelTask } from '@condo/domains/meter/hooks/useMeterReadingExportToExcelTask'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import {
    MeterReadingForOrganization,
    MeterReadingFilterTemplate,
    METER_TAB_TYPES,
    METER_TYPES,
    MeterTypes,
} from '@condo/domains/meter/utils/clientSchema'
import { getInitialSelectedReadingKeys } from '@condo/domains/meter/utils/helpers'


const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [0, 40]
const FILTERS_CONTAINER_GUTTER: RowProps['gutter'] = [16, 16]
const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { paddingLeft: 0 }

const SORTABLE_PROPERTIES = ['date', 'clientName', 'source']

type MetersTableContentProps = {
    filtersMeta: FiltersMeta<MeterReadingWhereInput>[]
    baseSearchQuery: MeterReadingWhereInput
    canManageMeterReadings: boolean
    isAutomatic?: boolean
    meter?: MeterType | PropertyMeter
    resource?: MeterResourceType
    sortableProperties?: string[]
    mutationErrorsToMessages?: Record<string, string>
    loading?: boolean
    showImportButton?: boolean
    refetchReadingsCount?: () => void
}


const MeterReadingsTableContent: React.FC<MetersTableContentProps> = ({
    filtersMeta,
    baseSearchQuery,
    canManageMeterReadings,
    sortableProperties,
    loading,
    isAutomatic,
    meter,
    resource,
    showImportButton = true,
    refetchReadingsCount,
}) => {
    const intl = useIntl()
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CancelSelectedReadingsMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const DeleteMeterReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading.DeleteMeterReadings' })
    const DeleteMeterReadingsMessageWarn = intl.formatMessage({ id: 'pages.condo.meter.MeterReading.DeleteMeterReadings.Warn' })
    const MeterReadingsMessage = intl.formatMessage({ id: 'import.meterReading.plural' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })

    const { user } = useAuth()
    const router = useRouter()
    const { filters, offset, sorters, tab } = parseQuery(router.query)
    const type = get(router.query, 'type')

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, sortableProperties || SORTABLE_PROPERTIES)

    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortMeterReadingsBy[], [sorters, sortersToSortBy])

    const [dateRange] = useDateRangeSearch('date')
    const dateFilterValue = dateRange || null
    const dateFilter = dateFilterValue ? dateFilterValue.map(el => el.toISOString()) : null
    const nextVerificationDate = get(meter, 'nextVerificationDate')
    const isDeletedProperty = !get(meter, 'property')

    const [isShowUpdateReadingModal, setIsShowUpdateReadingModal] = useState(false)
    const [chosenMeterReadingId, setChosenMeterReadingId] = useState<string>(null)

    const searchMeterReadingsQuery = useMemo(() => ({
        ...filtersToWhere({ ... !meter ? { date: dateFilter } : {}, ...filters }),
        ...baseSearchQuery,
    }), [baseSearchQuery, dateFilter, filters, filtersToWhere, meter])

    const {
        loading: meterReadingsLoading,
        count: total,
        objs: meterReadings,
        refetch,
    } = MeterReadingForOrganization.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const tableColumnsForSingleMeter = useTableColumns(filtersMeta, METER_TAB_TYPES.meterReading, METER_TYPES.unit, true, meterReadings)
    const tableColumnsForMeterReadings = useTableColumns(filtersMeta, METER_TAB_TYPES.meterReading, METER_TYPES.unit as MeterTypes)

    const { ExportButton } = useMeterReadingExportToExcelTask({
        where: searchMeterReadingsQuery,
        sortBy,
        user,
    })

    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const [selectedReadingKeys, setSelectedReadingKeys] = useState<string[]>(() => getInitialSelectedReadingKeys(router))
    const { MultipleFiltersModal, ResetFiltersModalButton, OpenFiltersButton, appliedFiltersCount } = useMultipleFiltersModal({
        filterMetas: filtersMeta,
        filtersSchemaGql: MeterReadingFilterTemplate,
        onReset: handleSearchReset,
        extraQueryParameters: { tab, type },
    })

    const updateSelectedReadingKeys = useCallback((selectedReadingKeys: string[]) => {
        setSelectedReadingKeys(selectedReadingKeys)
    }, [])

    const processedMeterReadings = useMemo(() => {
        const filteredMeterReading = [...meterReadings].sort((a, b) => (a.date < b.date ? 1 : -1))
        return uniqBy(filteredMeterReading, (reading => get(reading, 'meter.id')))
    }, [meterReadings])

    const readingsToFilter = meter ? meterReadings : processedMeterReadings

    const selectedRowKeysByPage = useMemo(() => {
        return readingsToFilter.filter(reading => selectedReadingKeys.includes(reading.id)).map(reading => reading.id)
    }, [readingsToFilter, selectedReadingKeys])

    const isSelectedAllRowsByPage = !meterReadingsLoading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length === readingsToFilter.length
    const isSelectedSomeRowsByPage = !meterReadingsLoading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length < readingsToFilter.length
    const CountSelectedReadingsMessage = useMemo(() => intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedReadingKeys.length }), [intl, selectedReadingKeys])

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
                await softDeleteMeterReadings(itemsToDelete).then(refetchReadingsCount)
            }
        }
    }, [selectedReadingKeys, softDeleteMeterReadings, refetchReadingsCount])

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

    const rowSelection: TableRowSelection<IMeterReading> = useMemo(() => ({
        selectedRowKeys: selectedRowKeysByPage,
        fixed: true,
        onSelect: handleSelectRow,
        columnTitle: (
            <Checkbox
                checked={isSelectedAllRowsByPage}
                indeterminate={isSelectedSomeRowsByPage}
                onChange={handleSelectAllRowsByPage}
            />
        ),
    }), [handleSelectAllRowsByPage, handleSelectRow, isSelectedAllRowsByPage, isSelectedSomeRowsByPage, selectedRowKeysByPage])

    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])
    const handleUpdateMeterReading = useCallback((record) => { 
        if (get(meter, 'archiveDate') || !get(meter, 'property')) {
            return {}
        }
        return {
            onClick: () => {
                setIsShowUpdateReadingModal(true)
                setChosenMeterReadingId(get(record, 'id'))
            },
        }
    }, [meter])

    const handleCreateMeterReadings = useCallback(() => router.push(`/meter/create?tab=${METER_TAB_TYPES.meterReading}`), [router])
    const handleCloseUpdateReadingModal = useCallback(() => setIsShowUpdateReadingModal(false), [])

    return (
        <>
            <Row
                gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                align='middle'
            >
                <Col span={24}>
                    {!meter && (
                        <TableFiltersContainer>
                            <Row gutter={FILTERS_CONTAINER_GUTTER} align='middle' justify='space-between'>
                                <Col style={{ flex: 1 }}>
                                    <Input
                                        placeholder={SearchPlaceholder}
                                        onChange={handleSearch}
                                        value={search}
                                        allowClear
                                        suffix={<Search size='medium' color={colors.gray[7]}/>}
                                    />
                                </Col>
                                <Col xs={24} md={5}>
                                    <MeterReadingDatePicker/>
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
                    <Row gutter={[0, 40]}>
                        {meter && meterReadings.length > 0 && (
                            <Col span={24}>
                                <Typography.Title level={3} >{MeterReadingsMessage}</Typography.Title>
                            </Col>
                        )}
                        <Table
                            totalRows={total}
                            loading={meterReadingsLoading || loading}
                            dataSource={meter ? meterReadings : processedMeterReadings}
                            columns={meter ? tableColumnsForSingleMeter : tableColumnsForMeterReadings}
                            rowSelection={rowSelection}
                            sticky
                            onRow={meter && handleUpdateMeterReading}
                        />
                    </Row>
                </Col>
                {
                    !loading && total > 0 && (
                        <Col span={24}>
                            <ActionBar
                                message={selectedReadingKeys.length > 0 && CountSelectedReadingsMessage}
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
                {selectedReadingKeys.length < 1 && !meter && (
                    <Col span={24}>
                        <ActionBar
                            actions={[
                                canManageMeterReadings && (
                                    <Button
                                        key='create'
                                        type='primary'
                                        onClick={handleCreateMeterReadings}
                                    >
                                        {CreateMeterReadingsButtonLabel}
                                    </Button>
                                ),
                                canManageMeterReadings && !meter && showImportButton && (
                                    <MetersImportWrapper
                                        key='import'
                                        accessCheck={canManageMeterReadings}
                                        onFinish={refetch}
                                    />
                                ),
                                <ExportButton key='export' id='exportToExcelMeterReadings' />,
                            ]}
                        />
                    </Col>
                )}
                {meter && selectedReadingKeys.length < 1 && (
                    <Col span={24}>
                        <ActionBarForSingleMeter
                            canManageMeterReadings={canManageMeterReadings}
                            meterId={get(meter, 'id')}
                            meterType={METER_TAB_TYPES.meter}
                            archiveDate={get(meter, 'archiveDate')}
                            isAutomatic={isAutomatic}
                            nextVerificationDate={nextVerificationDate}
                            propertyId={get(meter, 'property.id')}
                            unitName={get(meter, 'unitName')}
                            unitType={get(meter, 'unitType')}
                            isDeletedProperty={isDeletedProperty}
                        />
                    </Col>)
                }
            </Row>
            <UpdateMeterReadingModal 
                handleCloseUpdateReadingModal={handleCloseUpdateReadingModal}
                isShowUpdateReadingModal={isShowUpdateReadingModal}
                meter={meter}
                resource={resource}
                chosenMeterReadingId={chosenMeterReadingId}
                refetch={refetch}
                meterType={METER_TAB_TYPES.meter}
            />
            <MultipleFiltersModal />
        </>
    )
}

type MeterReadingsPageContentProps = Omit<MetersTableContentProps, 'mutationErrorsToMessages'>

export const MeterReadingsPageContent: React.FC<MeterReadingsPageContentProps> = ({
    filtersMeta,
    baseSearchQuery,
    canManageMeterReadings,
    loading,
    meter,
    isAutomatic,
    resource,
    showImportButton = true,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.manualCreateCard.body.description' })
    const CreateMeterReading = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingButtonLabel' })

    const { refetch } = MeterReadingForOrganization.useCount({}, { skip: true })
    const { count, loading: countLoading, refetch: refetchReadingsCount } = MeterReadingForOrganization.useCount({ where: baseSearchQuery })

    const nextVerificationDate = get(meter, 'nextVerificationDate')
    const isDeletedProperty = !get(meter, 'property')

    const PageContent = useMemo(() => {
        if (countLoading || loading) return <Loader />

        if (count === 0) {
            return (
                <>
                    {!meter && (
                        showImportButton ? (<EmptyListContent
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
                        />) : (<EmptyListContent
                            label={EmptyListLabel}
                            createRoute={`/meter/create?tab=${METER_TAB_TYPES.meterReading}`}
                            createLabel={CreateMeterReading}
                            accessCheck={canManageMeterReadings}
                        />) )}
                    {meter && (
                        <Col span={24}>
                            <ActionBarForSingleMeter
                                canManageMeterReadings={canManageMeterReadings}
                                meterId={get(meter, 'id')}
                                meterType={METER_TAB_TYPES.meter}
                                isAutomatic={isAutomatic}
                                archiveDate={get(meter, 'archiveDate')}
                                nextVerificationDate={nextVerificationDate}
                                propertyId={get(meter, 'property.id')}
                                unitName={get(meter, 'unitName')}
                                unitType={get(meter, 'unitType')}
                                isDeletedProperty={isDeletedProperty}
                            />
                        </Col>)
                    }
                </>

            )
        }

        return (
            <MeterReadingsTableContent
                filtersMeta={filtersMeta}
                baseSearchQuery={baseSearchQuery}
                canManageMeterReadings={canManageMeterReadings}
                loading={countLoading}
                meter={meter}
                isAutomatic={isAutomatic}
                resource={resource}
                showImportButton={showImportButton}
                refetchReadingsCount={refetchReadingsCount}
            />
        )
    }, [CreateMeterReading, EmptyListLabel, EmptyListManualBodyDescription, baseSearchQuery, canManageMeterReadings, count, countLoading, filtersMeta, isAutomatic, isDeletedProperty, loading, meter, nextVerificationDate, refetch, refetchReadingsCount, resource, showImportButton])

    return (
        <TablePageContent>
            {PageContent}
        </TablePageContent>
    )
}

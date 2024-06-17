import {
    Meter,
    MeterResource,
    PropertyMeter,
    PropertyMeterReadingWhereInput,
    SortPropertyMeterReadingsBy,
    PropertyMeterReading as PropertyMeterReadingType,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { TableRowSelection } from 'antd/lib/table/interface'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { PlusCircle, Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button, Checkbox } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MetersImportWrapper } from '@condo/domains/meter/components/Import/Index'
import ActionBarForSingleMeter from '@condo/domains/meter/components/Meters/ActionBarForSingleMeter'
import UpdateMeterReadingModal from '@condo/domains/meter/components/Meters/UpdateMeterReadingModal'
import { EXPORT_PROPERTY_METER_READINGS_QUERY } from '@condo/domains/meter/gql'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import {
    PropertyMeterReading,
    METER_TAB_TYPES, MeterReadingFilterTemplate, METER_TYPES, MeterTypes,
} from '@condo/domains/meter/utils/clientSchema'
import { getInitialSelectedReadingKeys } from '@condo/domains/meter/utils/helpers'



const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [16, 40]
const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { paddingLeft: 0 }
const FILTERS_CONTAINER_GUTTER: RowProps['gutter'] = [16, 16]

const SORTABLE_PROPERTIES = ['date', 'clientName', 'source']

type PropertyMetersTableContentProps = {
    filtersMeta: FiltersMeta<PropertyMeterReadingWhereInput>[]
    baseSearchQuery: PropertyMeterReadingWhereInput
    canManageMeterReadings: boolean
    isAutomatic?: boolean,
    sortableProperties?: string[]
    loading?: boolean
    meter?: Meter | PropertyMeter,
    resource?: MeterResource,
}

const PropertyMeterReadingsTableContent: React.FC<PropertyMetersTableContentProps> = (props) => {
    const {
        canManageMeterReadings,
        baseSearchQuery,
        filtersMeta,
        sortableProperties,
        loading,
        meter,
        isAutomatic,
        resource,
    } = props

    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })
    const CancelSelectedReadingsMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const CountSelectedReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading.CountSelectedReadings' })
    const DeleteMeterReadingsMessage = intl.formatMessage({ id: 'pages.condo.meter.MeterReading.DeleteMeterReadings' })
    const DeleteMeterReadingsMessageWarn = intl.formatMessage({ id: 'pages.condo.meter.MeterReading.DeleteMeterReadings.Warn' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })

    const router = useRouter()
    const { filters, offset, sorters, tab } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const nextVerificationDate = get(meter, 'nextVerificationDate')

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, sortableProperties || SORTABLE_PROPERTIES)
    const { getTrackingWrappedCallback } = useTracking()

    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortPropertyMeterReadingsBy[], [sorters, sortersToSortBy])

    const [isShowUpdateReadingModal, setIsShowUpdateReadingModal] = useState(false)
    const [chosenMeterReadingId, setChosenMeterReadingId] = useState<string>(null)

    const searchMeterReadingsQuery = useMemo(() => ({
        ...filtersToWhere(filters),
        ...baseSearchQuery,
    }), [baseSearchQuery, filters, filtersToWhere])

    const {
        loading: metersLoading,
        count: total,
        objs: propertyMeterReadings,
        refetch,
    } = PropertyMeterReading.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    })

    const tableColumnsForSingleMeter = useTableColumns(filtersMeta, METER_TAB_TYPES.meterReading, METER_TYPES.property, true, propertyMeterReadings)
    const tableColumnsForMeterReadings = useTableColumns(filtersMeta, METER_TAB_TYPES.meterReading, METER_TYPES.property as MeterTypes)

    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const [selectedReadingKeys, setSelectedReadingKeys] = useState<string[]>(() => getInitialSelectedReadingKeys(router))
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
        const filteredMeterReading = propertyMeterReadings.map(a => a).sort((a, b) => (a.date < b.date ? 1 : -1))
        return uniqBy(filteredMeterReading, (reading => get(reading, 'meter.id')))
    }, [propertyMeterReadings])

    const readingsToFilter = meter ? propertyMeterReadings : processedMeterReadings

    const selectedRowKeysByPage = useMemo(() => {
        return readingsToFilter.filter(reading => selectedReadingKeys.includes(reading.id)).map(reading => reading.id)
    }, [readingsToFilter, selectedReadingKeys])

    const isSelectedAllRowsByPage = !metersLoading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length === readingsToFilter.length
    const isSelectedSomeRowsByPage = !metersLoading && selectedRowKeysByPage.length > 0 && selectedRowKeysByPage.length < readingsToFilter.length

    const handleResetSelectedReadings = useCallback(() => {
        setSelectedReadingKeys([])
    }, [])

    const softDeleteMeterReadings = PropertyMeterReading.useSoftDeleteMany(async () => {
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

    const handleSelectRow: (record: PropertyMeterReadingType, checked: boolean) => void = useCallback((record, checked) => {
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

    const rowSelection: TableRowSelection<PropertyMeterReadingType> = useMemo(() => ({
        selectedRowKeys: selectedRowKeysByPage,
        fixed: true,
        onSelect: handleSelectRowWithTracking,
        columnTitle: (
            <Checkbox
                checked={isSelectedAllRowsByPage}
                indeterminate={isSelectedSomeRowsByPage}
                onChange={handleSelectAllRowsByPage}
            />
        ),
    }), [handleSelectAllRowsByPage, handleSelectRowWithTracking, isSelectedAllRowsByPage, isSelectedSomeRowsByPage, selectedRowKeysByPage])

    const handleUpdateMeterReading = useCallback((record) => { 
        if (get(meter, 'archiveDate')) {
            return {}
        }
        return {
            onClick: () => {
                setIsShowUpdateReadingModal(true)
                setChosenMeterReadingId(get(record, 'id'))
            },
        }
    }, [])
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])
    const handleCreateMeterReadings = useCallback(() => router.push(`/meter/create?tab=${METER_TAB_TYPES.propertyMeterReading}`), [router])
    const handleCloseUpdateReadingModal = useCallback(() => setIsShowUpdateReadingModal(false), [])

    return (
        <>
            <Row
                gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                align='middle'
                justify='center'
            >
                <Col span={24}>
                    {!meter && (
                        <TableFiltersContainer>
                            <Row style={{ display: 'flex' }} gutter={FILTERS_CONTAINER_GUTTER} align='middle'>
                                <Col style={{ flex: 1 }}>
                                    <Input
                                        placeholder={SearchPlaceholder}
                                        onChange={handleSearch}
                                        value={search}
                                        allowClear
                                        suffix={<Search size='medium' color={colors.gray[7]}/>}
                                    />
                                </Col>
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
                        </TableFiltersContainer>
                    )}
                </Col>
                <Col span={24}>
                    <Table
                        totalRows={total}
                        loading={metersLoading || loading}
                        dataSource={meter ? propertyMeterReadings : processedMeterReadings}
                        rowSelection={rowSelection}
                        columns={meter ? tableColumnsForSingleMeter : tableColumnsForMeterReadings}
                        onRow={meter && handleUpdateMeterReading}
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
                <Col span={24}>
                    {!meter && selectedReadingKeys.length < 1  && (
                        <ExportToExcelActionBar
                            searchObjectsQuery={searchMeterReadingsQuery}
                            exportToExcelQuery={EXPORT_PROPERTY_METER_READINGS_QUERY}
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
                                canManageMeterReadings && (
                                    <MetersImportWrapper
                                        key='import'
                                        accessCheck={canManageMeterReadings}
                                        onFinish={refetch}
                                    />
                                ),
                            ]}
                        />
                    )}
                    {meter && selectedReadingKeys.length < 1 && (
                        <ActionBarForSingleMeter 
                            canManageMeterReadings={canManageMeterReadings}
                            meterId={get(meter, 'id')}
                            meterType={METER_TAB_TYPES.propertyMeter}
                            archiveDate={get(meter, 'archiveDate')}
                            isAutomatic={isAutomatic}
                            nextVerificationDate={nextVerificationDate}
                            propertyId={get(meter, 'property.id')}
                        />)
                    }
                    
                </Col>
            </Row>
            <MultipleFiltersModal />
            <UpdateMeterReadingModal 
                chosenMeterReadingId={chosenMeterReadingId}
                handleCloseUpdateReadingModal={handleCloseUpdateReadingModal}
                isShowUpdateReadingModal={isShowUpdateReadingModal}
                meter={meter}
                refetch={refetch}
                resource={resource}
                meterType={METER_TAB_TYPES.propertyMeter}
            />
        </>
    )
}

export const PropertyMeterReadingsPageContent: React.FC<PropertyMetersTableContentProps> = (props) => {
    const {
        baseSearchQuery,
        canManageMeterReadings,
        loading,
        meter,
        isAutomatic,
    } = props

    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.propertyMeter.index.EmptyList.header' })
    const CreateMeterReading = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingButtonLabel' })

    const { count, loading: countLoading } = PropertyMeterReading.useCount({ where: baseSearchQuery })
    const nextVerificationDate = get(meter, 'nextVerificationDate')

    const pageContent = useMemo(() => {
        if (countLoading || loading) return <Loader />
        if (count === 0) 
            if (!meter) {
                return (
                    <EmptyListContent
                        label={EmptyListLabel}
                        createRoute={`/meter/create?tab=${METER_TAB_TYPES.propertyMeterReading}`}
                        createLabel={CreateMeterReading}
                        accessCheck={canManageMeterReadings}
                    />
                )
            } else {
                return (
                    <ActionBarForSingleMeter
                        canManageMeterReadings={canManageMeterReadings}
                        meterId={get(meter, 'id')}
                        meterType={METER_TAB_TYPES.propertyMeter}
                        archiveDate={get(meter, 'archiveDate')}
                        isAutomatic={isAutomatic}
                        nextVerificationDate={nextVerificationDate}
                        propertyId={get(meter, 'property.id')}
                    />
                )
            }

        return <PropertyMeterReadingsTableContent {...props} />

    }, [CreateMeterReading, EmptyListLabel, canManageMeterReadings, count, countLoading, isAutomatic, loading, meter, nextVerificationDate, props])

    return (
        <TablePageContent>
            {pageContent}
        </TablePageContent>
    )
}
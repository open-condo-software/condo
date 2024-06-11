import {
    Meter,
    MeterResource,
    PropertyMeterReadingWhereInput,
    SortPropertyMeterReadingsBy,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { PlusCircle, Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MetersImportWrapper } from '@condo/domains/meter/components/Import/Index'
import ActionBarForSingleMeter from '@condo/domains/meter/components/Meters/ActionBarForSingleMeter'
import UpdateMeterReadingModal from '@condo/domains/meter/components/Meters/UpdateMeterReadingModal'
import { EXPORT_PROPERTY_METER_READINGS_QUERY } from '@condo/domains/meter/gql'
import {
    PropertyMeterReading,
    METER_TAB_TYPES, MeterReadingFilterTemplate,
} from '@condo/domains/meter/utils/clientSchema'



const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [16, 40]
const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { paddingLeft: 0 }
const FILTERS_CONTAINER_GUTTER: RowProps['gutter'] = [16, 16]

const SORTABLE_PROPERTIES = ['date', 'clientName', 'source']

type PropertyMetersTableContentProps = {
    filtersMeta: FiltersMeta<PropertyMeterReadingWhereInput>[]
    tableColumns: ColumnsType
    baseSearchQuery: PropertyMeterReadingWhereInput
    canManageMeterReadings: boolean
    isAutomatic?: boolean,
    sortableProperties?: string[]
    loading?: boolean
    meter?: Meter
    resource?: MeterResource,
}

const PropertyMeterReadingsTableContent: React.FC<PropertyMetersTableContentProps> = (props) => {
    const {
        canManageMeterReadings,
        baseSearchQuery,
        filtersMeta,
        sortableProperties,
        tableColumns,
        loading,
        meter,
        isAutomatic,
        resource,
    } = props

    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })

    const router = useRouter()
    const { filters, offset, sorters, tab } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, sortableProperties || SORTABLE_PROPERTIES)

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
        objs: PropertyMeterReadings,
        refetch,
    } = PropertyMeterReading.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const { MultipleFiltersModal, ResetFiltersModalButton, OpenFiltersButton, appliedFiltersCount } = useMultipleFiltersModal({
        filterMetas: filtersMeta,
        filtersSchemaGql: MeterReadingFilterTemplate,
        onReset: handleSearchReset,
        extraQueryParameters: { tab },
    })

    const handleUpdateMeterReading = useCallback((record) => { 
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
                        dataSource={PropertyMeterReadings}
                        columns={tableColumns}
                        onRow={meter && handleUpdateMeterReading}
                    />
                </Col>
                <Col span={24}>
                    {!meter && (
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
                    {meter && <ActionBarForSingleMeter 
                        canManageMeterReadings={canManageMeterReadings}
                        meterId={get(meter, 'id')}
                        meterType={METER_TAB_TYPES.propertyMeter}
                        archiveDate={get(meter, 'archiveDate')}
                        isAutomatic={isAutomatic}
                    />}
                    
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
                    />
                )
            }

        return <PropertyMeterReadingsTableContent {...props} />

    }, [CreateMeterReading, EmptyListLabel, canManageMeterReadings, count, countLoading, isAutomatic, loading, meter, props])

    return (
        <TablePageContent>
            {pageContent}
        </TablePageContent>
    )
}
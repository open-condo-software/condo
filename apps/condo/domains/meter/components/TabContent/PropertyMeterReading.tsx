/** @jsx jsx */
import {
    PropertyMeterReadingWhereInput,
    SortPropertyMeterReadingsBy,
} from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Col, Row, RowProps } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { EXPORT_PROPERTY_METER_READINGS_QUERY } from '@condo/domains/meter/gql'
import { useUpdateMeterModal } from '@condo/domains/meter/hooks/useUpdateMeterModal'
import {
    PropertyMeterReading,
    METER_PAGE_TYPES,
} from '@condo/domains/meter/utils/clientSchema'


const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [0, 40]

const SORTABLE_PROPERTIES = ['date', 'clientName', 'source']

type PropertyMetersTableContentProps = {
    filtersMeta: FiltersMeta<PropertyMeterReadingWhereInput>[]
    tableColumns: ColumnsType
    baseSearchQuery: PropertyMeterReadingWhereInput
    canManageMeterReadings: boolean
    sortableProperties?: string[]
    loading?: boolean
}

const PropertyMetersTableContent: React.FC<PropertyMetersTableContentProps> = (props) => {
    const {
        canManageMeterReadings,
        baseSearchQuery,
        filtersMeta,
        sortableProperties,
        tableColumns,
        loading,
    } = props

    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })

    const router = useRouter()
    const { filters, offset, sorters } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, sortableProperties || SORTABLE_PROPERTIES)

    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortPropertyMeterReadingsBy[], [sorters, sortersToSortBy])

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

    const [search, handleSearchChange] = useSearch()
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch, METER_PAGE_TYPES.propertyMeter)

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                setSelectedMeter(meter)
            },
        }
    }, [setSelectedMeter])
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])
    const handleCreateMeterReadings = useCallback(() => router.push('/meter/create'), [])

    return (
        <>
            <Row
                gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                align='middle'
                justify='center'
            >
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row justify='space-between' gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}>
                            <Col xs={24} lg={7}>
                                <Input
                                    placeholder={SearchPlaceholder}
                                    onChange={handleSearch}
                                    value={search}
                                    allowClear
                                />
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    <Table
                        totalRows={total}
                        loading={metersLoading || loading}
                        dataSource={PropertyMeterReadings}
                        columns={tableColumns}
                        onRow={handleRowAction}
                    />
                </Col>
                <Col span={24}>
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
                        ]}
                    />
                </Col>
            </Row>
            <UpdateMeterModal />
        </>
    )
}

export const PropertyMetersPageContent: React.FC<PropertyMetersTableContentProps> = (props) => {
    const {
        baseSearchQuery,
        canManageMeterReadings,
        loading,
    } = props

    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.propertyMeter.index.EmptyList.header' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })

    const { count, loading: countLoading } = PropertyMeterReading.useCount({ where: baseSearchQuery })

    const pageContent = useMemo(() => {
        if (countLoading || loading) return <Loader />
        if (count === 0) return (
            <EmptyListContent
                label={EmptyListLabel}
                createRoute={`/meter/create?meterType=${METER_PAGE_TYPES.propertyMeter}`}
                createLabel={CreateMeter}
                accessCheck={canManageMeterReadings}
            />
        )

        return <PropertyMetersTableContent {...props} />
    }, [CreateMeter, EmptyListLabel, canManageMeterReadings, count, countLoading, props])

    return (
        <TablePageContent>
            {pageContent}
        </TablePageContent>
    )
}
/** @jsx jsx */
import {
    SortMeterReadingsBy,
    MeterReadingWhereInput,
} from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Col, Row, RowProps } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import get from 'lodash/get'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { QuestionCircle, PlusCircle, Search } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Button, Tooltip } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Loader } from '@condo/domains/common/components/Loader'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import {
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
    METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION,
} from '@condo/domains/meter/constants/errors'
import { EXPORT_METER_READINGS_QUERY } from '@condo/domains/meter/gql'
import { useImporterFunctions } from '@condo/domains/meter/hooks/useImporterFunctions'
import { useUpdateMeterModal } from '@condo/domains/meter/hooks/useUpdateMeterModal'
import {
    MeterReading,
    MeterReadingFilterTemplate,
    METER_PAGE_TYPES,
} from '@condo/domains/meter/utils/clientSchema'


const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [0, 40]
const FILTERS_CONTAINER_GUTTER: RowProps['gutter'] = [16, 16]
const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { paddingLeft: 0 }
const QUICK_FILTERS_COL_STYLE: CSSProperties = { alignSelf: 'center' }

const SORTABLE_PROPERTIES = ['date', 'clientName', 'source']

type MetersTableContentProps = {
    filtersMeta: FiltersMeta<MeterReadingWhereInput>[]
    tableColumns: ColumnsType
    baseSearchQuery: MeterReadingWhereInput
    canManageMeterReadings: boolean
    sortableProperties?: string[]
    mutationErrorsToMessages?: Record<string, string>
    loading?: boolean
}

const MetersTableContent: React.FC<MetersTableContentProps> = ({
    filtersMeta,
    tableColumns,
    baseSearchQuery,
    canManageMeterReadings,
    mutationErrorsToMessages,
    sortableProperties,
    loading,
}) => {
    const intl = useIntl()
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })
    const OnlyLatestMessage = intl.formatMessage({ id: 'pages.condo.meter.index.QuickFilterOnlyLatest' })
    const OnlyLatestDescMessage = intl.formatMessage({ id: 'pages.condo.meter.index.QuickFilterOnlyLatestDescription' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    const router = useRouter()
    const { filters, offset, sorters, tab } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const reduceNonEmpty = (cnt, filter) => cnt + Number((typeof filters[filter] === 'string' || Array.isArray(filters[filter])) && filters[filter].length > 0)
    const appliedFiltersCount = Object.keys(filters).reduce(reduceNonEmpty, 0)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, sortableProperties || SORTABLE_PROPERTIES)

    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortMeterReadingsBy[], [sorters, sortersToSortBy])

    const searchMeterReadingsQuery = useMemo(() => ({
        ...filtersToWhere(filters),
        ...baseSearchQuery,
    }), [baseSearchQuery, filters, filtersToWhere])

    const {
        loading: metersLoading,
        count: total,
        objs: meterReadings,
        refetch,
    } = MeterReading.useObjects({
        sortBy,
        where: searchMeterReadingsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch)
    const { MultipleFiltersModal, ResetFiltersModalButton, OpenFiltersButton } = useMultipleFiltersModal(
        filtersMeta,
        MeterReadingFilterTemplate,
        handleSearchReset,
        null,
        null,
        [],
        { tab }
    )

    const [columns, meterReadingNormalizer, meterReadingValidator, meterReadingCreator] = useImporterFunctions()

    const [showOnlyLatestReadings, setShowOnlyLatestReadings] = useState(false)
    const switchShowOnlyLatestReadings = useCallback(
        () => setShowOnlyLatestReadings(!showOnlyLatestReadings),
        [showOnlyLatestReadings]
    )
    const processedMeterReadings = useMemo(() => {
        if (showOnlyLatestReadings) {
            const filteredMeterReading = meterReadings.map(a => a).sort((a, b) => (a.date < b.date ? 1 : -1))
            return uniqBy(filteredMeterReading, (reading => get(reading, 'meter.id')))
        }
    }, [showOnlyLatestReadings, meterReadings])

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
            >
                <Col span={24}>
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
                                        <Tooltip
                                            placement='rightBottom'
                                            title={OnlyLatestDescMessage}
                                            children={<>
                                                <Checkbox
                                                    checked={showOnlyLatestReadings}
                                                    onClick={switchShowOnlyLatestReadings}
                                                    children={OnlyLatestMessage}
                                                />
                                                <QuestionCircle size='medium'/>
                                            </>}
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
                </Col>
                <Col span={24}>
                    <Table
                        totalRows={total}
                        loading={metersLoading || loading}
                        dataSource={showOnlyLatestReadings ? processedMeterReadings : meterReadings}
                        columns={tableColumns}
                        onRow={handleRowAction}
                    />
                </Col>
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
                            canManageMeterReadings && (
                                <ImportWrapper
                                    key='import'
                                    accessCheck={canManageMeterReadings}
                                    onFinish={refetch}
                                    columns={columns}
                                    rowNormalizer={meterReadingNormalizer}
                                    rowValidator={meterReadingValidator}
                                    objectCreator={meterReadingCreator}
                                    mutationErrorsToMessages={mutationErrorsToMessages}
                                    domainName='meter'
                                />
                            ),
                        ]}
                    />
                </Col>
            </Row>
            <UpdateMeterModal />
            <MultipleFiltersModal />
        </>
    )
}

type MetersPageContentProps = Omit<MetersTableContentProps, 'mutationErrorsToMessages'>

export const MetersPageContent: React.FC<MetersPageContentProps> = ({
    filtersMeta,
    tableColumns,
    baseSearchQuery,
    canManageMeterReadings,
    loading,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.manualCreateCard.body.description' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })
    const MeterAccountNumberExistInOtherUnitMessage = intl.formatMessage({ id: 'meter.import.error.MeterAccountNumberExistInOtherUnit' })
    const MeterResourceOwnedByAnotherOrganizationMessage = intl.formatMessage({ id: 'api.meter.METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION' })
    const MeterNumberExistInOrganizationMessage = intl.formatMessage({ id: 'meter.import.error.MeterNumberExistInOrganization' })

    const { refetch } = MeterReading.useCount({}, { skip: true })
    const { count, loading: countLoading } = MeterReading.useCount({ where: baseSearchQuery })

    const [columns, meterReadingNormalizer, meterReadingValidator, meterReadingCreator] = useImporterFunctions()

    const mutationErrorsToMessages = useMemo(() => ({
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: MeterAccountNumberExistInOtherUnitMessage,
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: MeterNumberExistInOrganizationMessage,
        [METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION]: MeterResourceOwnedByAnotherOrganizationMessage,
    }), [MeterAccountNumberExistInOtherUnitMessage, MeterNumberExistInOrganizationMessage, MeterResourceOwnedByAnotherOrganizationMessage])

    const PageContent = useMemo(() => {
        if (countLoading || loading) return <Loader />

        if (count === 0) {
            return (
                <EmptyListContent
                    label={EmptyListLabel}
                    importLayoutProps={{
                        manualCreateEmoji: EMOJI.CLOCK,
                        manualCreateDescription: EmptyListManualBodyDescription,
                        importCreateEmoji: EMOJI.LIST,
                        importWrapper: {
                            onFinish: refetch,
                            columns: columns,
                            rowNormalizer: meterReadingNormalizer,
                            rowValidator: meterReadingValidator,
                            objectCreator: meterReadingCreator,
                            domainName: 'meter',
                            mutationErrorsToMessages,
                        },
                    }}
                    createRoute={`/meter/create?meterType=${METER_PAGE_TYPES.meter}`}
                    accessCheck={canManageMeterReadings}
                />
            )
        }

        return (
            <MetersTableContent
                filtersMeta={filtersMeta}
                tableColumns={tableColumns}
                baseSearchQuery={baseSearchQuery}
                canManageMeterReadings={canManageMeterReadings}
                mutationErrorsToMessages={mutationErrorsToMessages}
                loading={countLoading}
            />
        )
    }, [
        CreateMeter, EmptyListLabel, EmptyListManualBodyDescription, baseSearchQuery, canManageMeterReadings,
        columns, count, countLoading, filtersMeta, loading, meterReadingCreator, meterReadingNormalizer, meterReadingValidator,
        mutationErrorsToMessages, refetch, tableColumns,
    ])

    return (
        <TablePageContent>
            {PageContent}
        </TablePageContent>
    )
}
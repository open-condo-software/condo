/** @jsx jsx */
import {
    SortMeterReadingsBy,
    MeterReportingPeriod as MeterReportingPeriodType,
    MutationUpdateMeterReportingPeriodsArgs,
} from '@app/condo/schema'
import { jsx } from '@emotion/react'
import { Col, Row, RowProps, Tabs, Typography } from 'antd'
import { TableRowSelection } from 'antd/lib/table/interface'
import chunk from 'lodash/chunk'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { FileDown, Filter, QuestionCircle, PlusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Space, Tooltip } from '@open-condo/ui'

import { BaseMutationArgs } from '@condo/domains/banking/hooks/useBankTransactionsTable'
import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input from '@condo/domains/common/components/antd/Input'
import {
    PageHeader,
    PageWrapper,
    useLayoutContext,
} from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { ExportToExcelActionBar } from '@condo/domains/common/components/ExportToExcelActionBar'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { BIGGER_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/featureflags'
import { DEFAULT_RECORDS_LIMIT_FOR_IMPORT } from '@condo/domains/common/constants/import'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import {
    MultipleFilterContextProvider,
    useMultipleFiltersModal,
} from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MeterReadPermissionRequired } from '@condo/domains/meter/components/PageAccess'
import { METER_REPORTING_PERIOD_FRONTEND_FEATURE_FLAG } from '@condo/domains/meter/constants/constants'
import {
    EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT,
    EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION,
    METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION,
} from '@condo/domains/meter/constants/errors'
import { EXPORT_METER_READINGS_QUERY } from '@condo/domains/meter/gql'
import { useFilters } from '@condo/domains/meter/hooks/useFilters'
import { useImporterFunctions } from '@condo/domains/meter/hooks/useImporterFunctions'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import { useUpdateMeterModal } from '@condo/domains/meter/hooks/useUpdateMeterModal'
import {
    MeterReading,
    PropertyMeterReading,
    MeterReadingFilterTemplate,
    MeterPageTypes,
    MeterReportingPeriod,
    METER_PAGE_TYPES,
} from '@condo/domains/meter/utils/clientSchema'


const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [0, 40]
const FILTERS_CONTAINER_GUTTER: RowProps['gutter'] = [20, 20]
const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { paddingLeft: 0 }
const DEFAULT_PERIOD_TEXT_STYLE = { alignSelf: 'start' }
const QUICK_FILTERS_COL_STYLE: CSSProperties = { alignSelf: 'center' }

export type UpdateSelectedMeterReportingPeriods = (args: BaseMutationArgs<MutationUpdateMeterReportingPeriodsArgs>) => Promise<unknown>

export const MetersPageContent = ({
    searchMeterReadingsQuery,
    tableColumns,
    sortBy,
    filterMetas,
    role,
    loading,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })
    const CreateMeterReadingsButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterReadingsButtonLabel' })
    const OnlyLatestMessage = intl.formatMessage({ id: 'pages.condo.meter.index.QuickFilterOnlyLatest' })
    const OnlyLatestDescMessage = intl.formatMessage({ id: 'pages.condo.meter.index.QuickFilterOnlyLatestDescription' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const FiltersButtonLabel = intl.formatMessage({ id: 'FiltersLabel' })
    const MeterReadingImportObjectsName = intl.formatMessage({ id: 'meter.import.MeterReading.objectsName.many' })
    const MeterReadingImportObjectsNameManyGenitive = intl.formatMessage({ id: 'meter.import.MeterReading.objectsName.many.genitive' })
    const MeterAccountNumberExistInOtherUnitMessage = intl.formatMessage({ id: 'meter.import.error.MeterAccountNumberExistInOtherUnit' })
    const MeterResourceOwnedByAnotherOrganizationMessage = intl.formatMessage({ id: 'api.meter.METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION' })
    const MeterNumberExistInOrganizationMessage = intl.formatMessage({ id: 'meter.import.error.MeterNumberExistInOrganization' })
    const ImportButtonMessage = intl.formatMessage({ id: 'containers.FormTableExcelImport.ClickOrDragImportFileHint' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const reduceNonEmpty = (cnt, filter) => cnt + Number((typeof filters[filter] === 'string' || Array.isArray(filters[filter])) && filters[filter].length > 0)
    const appliedFiltersCount = Object.keys(filters).reduce(reduceNonEmpty, 0)

    const canManageMeterReadings = get(role, 'canManageMeterReadings', false)

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

    const { breakpoints } = useLayoutContext()
    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch)
    const { MultipleFiltersModal, setIsMultipleFiltersModalVisible, ResetFiltersModalButton } = useMultipleFiltersModal(filterMetas, MeterReadingFilterTemplate, handleSearchReset)
    const [columns, meterReadingNormalizer, meterReadingValidator, meterReadingCreator] = useImporterFunctions()
    const isNoMeterData = isEmpty(meterReadings) && isEmpty(filters) && !metersLoading && !loading

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
    const handleMultipleFiltersButtonClick = useCallback(() => setIsMultipleFiltersModalVisible(true),
        [setIsMultipleFiltersModalVisible])

    const mutationErrorsToMessages = useMemo(() => ({
        [EXISTING_METER_ACCOUNT_NUMBER_IN_OTHER_UNIT]: MeterAccountNumberExistInOtherUnitMessage,
        [EXISTING_METER_NUMBER_IN_SAME_ORGANIZATION]: MeterNumberExistInOrganizationMessage,
        [METER_RESOURCE_OWNED_BY_ANOTHER_ORGANIZATION]: MeterResourceOwnedByAnotherOrganizationMessage,
    }), [MeterAccountNumberExistInOtherUnitMessage, MeterNumberExistInOrganizationMessage, MeterResourceOwnedByAnotherOrganizationMessage])

    const exampleTemplateLink = useMemo(() => `/meter-import-example-${intl.locale}.xlsx`, [intl.locale])

    const handleCreateMeterReadings = useCallback(() => router.push('/meter/create'), [])

    const { useFlagValue } = useFeatureFlags()
    const maxTableLength: number = useFlagValue(BIGGER_LIMIT_FOR_IMPORT) || DEFAULT_RECORDS_LIMIT_FOR_IMPORT

    return (
        <>
            <TablePageContent>
                <EmptyListView
                    label={EmptyListLabel}
                    message=''
                    button={(
                        <ImportWrapper
                            objectsName={MeterReadingImportObjectsName}
                            accessCheck={canManageMeterReadings}
                            onFinish={refetch}
                            columns={columns}
                            maxTableLength={maxTableLength}
                            rowNormalizer={meterReadingNormalizer}
                            rowValidator={meterReadingValidator}
                            objectCreator={meterReadingCreator}
                            domainTranslate={MeterReadingImportObjectsNameManyGenitive}
                            exampleTemplateLink={exampleTemplateLink}
                            mutationErrorsToMessages={mutationErrorsToMessages}
                        >
                            <Button
                                type='secondary'
                                icon={<FileDown size='medium' />}
                            />
                        </ImportWrapper>
                    )}
                    createRoute={`/meter/create?meterType=${METER_PAGE_TYPES.meter}`}
                    createLabel={CreateMeter}
                    containerStyle={{ display: isNoMeterData ? 'flex' : 'none' }}
                    accessCheck={canManageMeterReadings}
                />
                <Row
                    gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                    align='middle'
                    hidden={isNoMeterData}
                >
                    <Col span={24}>
                        <TableFiltersContainer>
                            <Row gutter={FILTERS_CONTAINER_GUTTER} align='middle' justify='space-between'>
                                <Col xs={24} lg={12}>
                                    <Row justify='start' gutter={FILTERS_CONTAINER_GUTTER}>
                                        <Col>
                                            <Input
                                                placeholder={SearchPlaceholder}
                                                onChange={handleSearch}
                                                value={search}
                                                allowClear
                                            />
                                        </Col>
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
                                    <Space size={12} direction={breakpoints.TABLET_LARGE ? 'horizontal' : 'vertical'}>
                                        {
                                            breakpoints.TABLET_LARGE && appliedFiltersCount > 0 && (
                                                <ResetFiltersModalButton style={RESET_FILTERS_BUTTON_STYLE} />
                                            )
                                        }
                                        <Button
                                            type='secondary'
                                            onClick={handleMultipleFiltersButtonClick}
                                            icon={<Filter size='medium'/>}
                                        >
                                            {
                                                appliedFiltersCount > 0 ?
                                                    `${FiltersButtonLabel} (${appliedFiltersCount})`
                                                    : FiltersButtonLabel
                                            }
                                        </Button>
                                        {
                                            !breakpoints.TABLET_LARGE && appliedFiltersCount > 0 && (
                                                <ResetFiltersModalButton style={RESET_FILTERS_BUTTON_STYLE}/>
                                            )
                                        }
                                    </Space>
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
                                        objectsName={MeterReadingImportObjectsName}
                                        accessCheck={canManageMeterReadings}
                                        onFinish={refetch}
                                        columns={columns}
                                        maxTableLength={maxTableLength}
                                        rowNormalizer={meterReadingNormalizer}
                                        rowValidator={meterReadingValidator}
                                        objectCreator={meterReadingCreator}
                                        domainTranslate={MeterReadingImportObjectsNameManyGenitive}
                                        exampleTemplateLink={exampleTemplateLink}
                                        mutationErrorsToMessages={mutationErrorsToMessages}
                                    >
                                        <Button
                                            type='secondary'
                                            icon={<FileDown size='medium' />}
                                        >
                                            {ImportButtonMessage}
                                        </Button>
                                    </ImportWrapper>
                                ),
                            ]}
                        />
                    </Col>
                </Row>
                <UpdateMeterModal />
                <MultipleFiltersModal />
            </TablePageContent>
        </>
    )
}

export const PropertyMetersPageContent = ({
    searchMeterReadingsQuery,
    tableColumns,
    sortBy,
    filterMetas,
    role,
    loading,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const canManageMeterReadings = get(role, 'canManageMeterReadings', false)

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

    const { breakpoints } = useLayoutContext()
    const [search, handleSearchChange, handleSearchReset] = useSearch()
    const { UpdateMeterModal, setSelectedMeter } = useUpdateMeterModal(refetch, METER_PAGE_TYPES.propertyMeter)
    const isNoMeterData = isEmpty(PropertyMeterReadings) && isEmpty(filters) && !metersLoading && !loading

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                const meter = get(record, 'meter')
                setSelectedMeter(meter)
            },
        }
    }, [setSelectedMeter])
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])

    return (
        <>
            <TablePageContent>
                <EmptyListView
                    label={EmptyListLabel}
                    message=''
                    createRoute={`/meter/create?meterType=${METER_PAGE_TYPES.propertyMeter}`}
                    createLabel={CreateMeter}
                    containerStyle={{ display: isNoMeterData ? 'flex' : 'none' }}
                    accessCheck={canManageMeterReadings}
                />
                <Row
                    gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                    align='middle'
                    justify='center'
                    hidden={isNoMeterData}
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
                </Row>
                <UpdateMeterModal />
            </TablePageContent>
        </>
    )
}

export const MeterReportingPeriodPageContent = ({
    searchMeterReportingPeriodsQuery,
    tableColumns,
    sortBy,
    filterMetas,
    role,
    loading,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.EmptyList.header' })
    const CreateReportingPeriodLabel = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriod.EmptyList.create' })
    const DeleteLabel = intl.formatMessage({ id: 'Delete' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.reportingPeriod.update.ConfirmDeleteMessage' })

    const router = useRouter()
    const { filters, offset } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const canManageMeters = get(role, 'canManageMeters', false)

    const {
        loading: periodLoading,
        count: total,
        objs: reportingPeriods,
        refetch,
    } = MeterReportingPeriod.useObjects({
        sortBy,
        where: searchMeterReportingPeriodsQuery,
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        fetchPolicy: 'network-only',
    })

    const defaultPeriod = useRef<MeterReportingPeriodType>()

    const reportingPeriodsProcessedForTable = useMemo(() => {
        return compact(reportingPeriods.map(period => {
            if (period.organization !== null) return period
            else defaultPeriod.current = period
        }))
    }, [reportingPeriods])
    const DefaultPeriodMessage = intl.formatMessage(
        { id: 'pages.condo.meter.index.reportingPeriod.defaultPeriod' },
        {
            notifyStartDay: get(defaultPeriod, 'current.notifyStartDay'),
            notifyEndDay: get(defaultPeriod, 'current.notifyEndDay'),
        }
    )

    const [search, handleSearchChange] = useSearch()
    const isNoMeterData = isEmpty(reportingPeriods) && isEmpty(filters) && !periodLoading && !loading

    const handleRowAction = useCallback((record) => {
        if (record.organization) {
            return {
                onClick: () => {
                    router.push(`/meter/reportingPeriod/${record.id}/update`)
                },
            }
        }
    }, [reportingPeriods])
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])

    const handleCreateButtonClick = () => router.push('/meter/reportingPeriod/create')

    const [selectedRows, setSelectedRows] = useState([])

    const handleSelectRow = useCallback((record, checked) => {
        const selectedKey = record.id
        if (checked) {
            setSelectedRows([...selectedRows, record])
        } else {
            setSelectedRows(selectedRows.filter(({ id }) => id !== selectedKey))
        }
    }, [selectedRows])

    const handleSelectAll = useCallback((checked) => {
        if (checked) {
            setSelectedRows(reportingPeriodsProcessedForTable)
        } else {
            setSelectedRows([])
        }
    }, [reportingPeriodsProcessedForTable])

    const rowSelection: TableRowSelection<MeterReportingPeriodType> = useMemo(() => ({
        type: 'checkbox',
        onSelect: handleSelectRow,
        onSelectAll: handleSelectAll,
        selectedRowKeys: selectedRows.map(row => row.id),
    }), [handleSelectRow, handleSelectAll, selectedRows])

    const softDeleteMeterReportingPeriods = MeterReportingPeriod.useSoftDeleteMany(() => {
        setSelectedRows([])
        refetch()
    })

    const handleDeleteButtonClick = useCallback(async () => {
        if (selectedRows.length) {
            const itemsToDeleteByChunks = chunk(selectedRows, 30)
            for (const itemsToDelete of itemsToDeleteByChunks) {
                await softDeleteMeterReportingPeriods(selectedRows)
            }
        }
    }, [softDeleteMeterReportingPeriods, selectedRows])

    return (
        <>
            <TablePageContent>
                <EmptyListView
                    label={EmptyListLabel}
                    message=''
                    createRoute='/meter/reportingPeriod/create'
                    createLabel={CreateReportingPeriodLabel}
                    containerStyle={{ display: isNoMeterData ? 'flex' : 'none' }}
                    accessCheck={canManageMeters}
                />
                <Row
                    gutter={METERS_PAGE_CONTENT_ROW_GUTTERS}
                    align='middle'
                    justify='center'
                    hidden={isNoMeterData}
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
                    {defaultPeriod.current && <Col span={24}>
                        <Typography.Text style={DEFAULT_PERIOD_TEXT_STYLE} type='secondary'>
                            {DefaultPeriodMessage}
                        </Typography.Text>
                    </Col>}
                    <Col span={24}>
                        <Table
                            totalRows={total}
                            loading={periodLoading || loading}
                            dataSource={reportingPeriodsProcessedForTable}
                            columns={tableColumns}
                            onRow={handleRowAction}
                            rowSelection={rowSelection}
                        />
                    </Col>
                </Row>
                {
                    canManageMeters && !isNoMeterData && (
                        <ActionBar
                            actions={[
                                <Button
                                    key='createPeriod'
                                    type='primary'
                                    onClick={handleCreateButtonClick}
                                >
                                    {CreateReportingPeriodLabel}
                                </Button>,
                                selectedRows.length > 0 ? <DeleteButtonWithConfirmModal
                                    key='deleteSelectedPeriods'
                                    title={ConfirmDeleteTitle}
                                    message={ConfirmDeleteMessage}
                                    okButtonLabel={DeleteLabel}
                                    action={handleDeleteButtonClick}
                                    buttonContent={DeleteLabel}
                                /> : undefined,
                            ]}
                        />
                    )
                }
            </TablePageContent>
        </>
    )
}

interface IMeterIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const sortableProperties = ['date', 'clientName', 'source']

function MeterPageTypeFromQuery (tabFromQuery) {
    switch (tabFromQuery) {
        case METER_PAGE_TYPES.meter:
            return METER_PAGE_TYPES.meter
        case METER_PAGE_TYPES.propertyMeter:
            return METER_PAGE_TYPES.propertyMeter
        case METER_PAGE_TYPES.reportingPeriod:
            return METER_PAGE_TYPES.reportingPeriod
        default:
            return undefined
    }
}

const MetersPage: IMeterIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.meter.index.PageTitle' })
    const MeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.meterTab' })
    const PropertyMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.index.propertyMeterTab' })
    const ReportingPeriodMessage = intl.formatMessage({ id: 'pages.condo.meter.index.reportingPeriodTab' })

    const { organization, link, isLoading } = useOrganization()
    const userOrganizationId = get(organization, 'id')
    const role = get(link, 'role')
    const router = useRouter()

    const { useFlag } = useFeatureFlags()
    const isMeterReportingPeriodEnabled = useFlag(METER_REPORTING_PERIOD_FRONTEND_FEATURE_FLAG)

    const { GlobalHints } = useGlobalHints()

    const [tab, setTab] = useState<MeterPageTypes>(METER_PAGE_TYPES.meter)
    useEffect(() => {
        const tabFromRoute = MeterPageTypeFromQuery(router.query.tab ? router.query.tab : METER_PAGE_TYPES.meter)
        if (tabFromRoute) {
            setTab(tabFromRoute)
            router.replace({ query: { ...router.query, tab: tabFromRoute } })
        }
    }, [])

    const filterMetas = useFilters(tab)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, sortableProperties)
    const { filters, sorters } = parseQuery(router.query)
    const tableColumns = useTableColumns(filterMetas, tab)
    const searchMeterReadingsQuery = useMemo(() => ({
        ...filtersToWhere(filters),
        meter: { deletedAt: null },
        organization: { id: userOrganizationId } }),
    [filters, filtersToWhere, userOrganizationId])
    const searchMeterReportingPeriodsQuery = useMemo(() => {
        return {
            OR: [
                { organization_is_null: true },
                {
                    AND: [{
                        ...filtersToWhere(filters),
                        organization: { id: userOrganizationId },
                    }],
                },
            ],
        }},
    [filters, filtersToWhere, userOrganizationId])
    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortMeterReadingsBy[], [sorters, sortersToSortBy])


    const handleTabChange = useCallback((tab: MeterPageTypes) => {
        setTab(tab)
        router.replace({ query: { ...router.query, tab } })
    }, [tab])

    return (
        <MultipleFilterContextProvider>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                {GlobalHints}
                <PageHeader title={<Typography.Title>{PageTitleMessage}</Typography.Title>}/>
                <Tabs activeKey={tab} onChange={handleTabChange}>
                    <Tabs.TabPane tab={MeterMessage} key={METER_PAGE_TYPES.meter} />
                    {isMeterReportingPeriodEnabled && <Tabs.TabPane tab={ReportingPeriodMessage} key={METER_PAGE_TYPES.reportingPeriod} />}
                    <Tabs.TabPane tab={PropertyMeterMessage} key={METER_PAGE_TYPES.propertyMeter} />
                </Tabs>
                {
                    tab === METER_PAGE_TYPES.meter && (
                        <MetersPageContent
                            tableColumns={tableColumns}
                            searchMeterReadingsQuery={searchMeterReadingsQuery}
                            sortBy={sortBy}
                            filterMetas={filterMetas}
                            role={role}
                            loading={isLoading}
                        />
                    )
                }
                {
                    tab === METER_PAGE_TYPES.propertyMeter && (
                        <PropertyMetersPageContent
                            tableColumns={tableColumns}
                            searchMeterReadingsQuery={searchMeterReadingsQuery}
                            sortBy={sortBy}
                            filterMetas={filterMetas}
                            role={role}
                            loading={isLoading}
                        />
                    )
                }
                {
                    tab === METER_PAGE_TYPES.reportingPeriod && isMeterReportingPeriodEnabled && (
                        <MeterReportingPeriodPageContent
                            tableColumns={tableColumns}
                            searchMeterReportingPeriodsQuery={searchMeterReportingPeriodsQuery}
                            sortBy={sortBy}
                            filterMetas={filterMetas}
                            role={role}
                            loading={isLoading}
                        />
                    )
                }

            </PageWrapper>
        </MultipleFilterContextProvider>
    )
}

MetersPage.requiredAccess = MeterReadPermissionRequired

export default MetersPage

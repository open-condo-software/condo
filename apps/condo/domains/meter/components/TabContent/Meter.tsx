import { useUpdateMetersMutation } from '@app/condo/gql'
import {
    MeterReadingWhereInput,
    SortMetersBy,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useMemo, useState } from 'react'

import { Search } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, ActionBarProps, Button, Checkbox } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { Loader } from '@condo/domains/common/components/Loader'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { useDateRangeSearch } from '@condo/domains/common/hooks/useDateRangeSearch'
import { useMultipleFiltersModal } from '@condo/domains/common/hooks/useMultipleFiltersModal'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useTableRowSelection } from '@condo/domains/common/hooks/useTableRowSelection'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MetersImportWrapper } from '@condo/domains/meter/components/Import/Index'
import { useTableColumns } from '@condo/domains/meter/hooks/useTableColumns'
import {
    MeterReadingFilterTemplate,
    MeterForOrganization,
    METER_TAB_TYPES,
    METER_TYPES,
} from '@condo/domains/meter/utils/clientSchema'
import { getInitialArchivedOrActiveMeter } from '@condo/domains/meter/utils/helpers'

const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [0, 40]
const FILTERS_CONTAINER_GUTTER: RowProps['gutter'] = [16, 16]
const QUICK_FILTERS_COL_STYLE: CSSProperties = { alignSelf: 'center' }
const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { paddingLeft: 0 }
const FULL_WIDTH_DATE_RANGE_STYLE: CSSProperties = { width: '100%' }

const SORTABLE_PROPERTIES = ['verificationDate', 'source']
const DEFAULT_DATE_RANGE: [Dayjs, Dayjs] = [dayjs(), dayjs().add(2, 'month')]


type MetersTableContentProps = {
    filtersMeta: FiltersMeta<MeterReadingWhereInput>[]
    baseSearchQuery: MeterReadingWhereInput
    canManageMeters: boolean
    sortableProperties?: string[]
    mutationErrorsToMessages?: Record<string, string>
    loading?: boolean
    showImportButton?: boolean
}

type UpdateMeterQueryParamsType = {
    isShowActiveMeters: string
    isShowArchivedMeters: string
}

interface IDefaultMetersActionBarProps {
    canManageMeters: boolean
    showImportButton: boolean
    onImportFinish: () => void
}
const DefaultMetersActionBar: React.FC<IDefaultMetersActionBarProps> = ({ canManageMeters, showImportButton, onImportFinish }) => {
    const intl = useIntl()
    const CreateMeterButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })

    const router = useRouter()
    const handleCreateMeterReadings = useCallback(() => router.push(`/meter/create?tab=${METER_TAB_TYPES.meter}`), [router])

    return (
        <ActionBar actions={[
            <Button
                key='create'
                type='primary'
                onClick={handleCreateMeterReadings}
            >
                {CreateMeterButtonLabel}
            </Button>,
            showImportButton && (
                <MetersImportWrapper
                    key='import'
                    accessCheck={canManageMeters}
                    onFinish={onImportFinish}
                />
            ),
        ]}/>
    )
}

interface IActionBarWithSelectedItemsProps {
    selectedKeys: string[]
    clearSelection: () => void
    onDeleteCompleted: () => Promise<void>
}
const ActionBarWithSelectedItems: React.FC<IActionBarWithSelectedItemsProps> = ({ selectedKeys, clearSelection, onDeleteCompleted }) => {
    const intl = useIntl()
    const CancelSelectionMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const ConfirmDeleteManyMetersTitle = intl.formatMessage({ id: 'pages.condo.meter.ConfirmDeleteManyTitle' })
    const ConfirmDeleteManyMetersMessage = intl.formatMessage({ id: 'global.ImpossibleToRestore' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })

    const router = useRouter()
    const client = useApolloClient()

    const SelectedItemsMessage = useMemo(() => intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedKeys.length }), [intl, selectedKeys])

    const [updateMetersMutation] = useUpdateMetersMutation({
        onCompleted: async () => {
            await onDeleteCompleted()
        },
    })

    const updateSelectedMetersByChunks = useCallback(async (payload) => {
        if (!selectedKeys.length) return

        const itemsToDeleteByChunks = chunk(selectedKeys.map((key) => ({
            id: key,
            data: {
                dv: 1,
                sender: getClientSideSenderInfo(),
                ...payload,
            },
        })), 30)

        for (const itemsToDelete of itemsToDeleteByChunks) {
            await updateMetersMutation({
                variables: {
                    data: itemsToDelete,
                },
            })
        }

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allMeters' })
        client.cache.gc()
    }, [client.cache, selectedKeys, updateMetersMutation])

    const handleDeleteButtonClick = useCallback(async () => {
        const now = new Date().toISOString()
        await updateSelectedMetersByChunks({ deletedAt: now })
        await updateQuery(router, {
            newParameters: {
                offset: 0,
            },
        }, { routerAction: 'replace', resetOldParameters: false })
    }, [router, updateSelectedMetersByChunks])

    const selectedContactsActionBarButtons: ActionBarProps['actions'] = useMemo(() => [
        <DeleteButtonWithConfirmModal
            key='deleteSelectedMeters'
            title={ConfirmDeleteManyMetersTitle}
            message={ConfirmDeleteManyMetersMessage}
            okButtonLabel={DeleteMessage}
            action={handleDeleteButtonClick}
            buttonContent={DeleteMessage}
            cancelMessage={DontDeleteMessage}
            showCancelButton
            cancelButtonType='primary'
        />,
        <Button
            key='cancelMetersSelection'
            type='secondary'
            onClick={clearSelection}
        >
            {CancelSelectionMessage}
        </Button>,
    ], [
        ConfirmDeleteManyMetersTitle, ConfirmDeleteManyMetersMessage, DeleteMessage, handleDeleteButtonClick,
        DontDeleteMessage, clearSelection, CancelSelectionMessage,
    ])

    return (
        <ActionBar
            message={SelectedItemsMessage}
            actions={selectedContactsActionBarButtons}
        />
    )
}

const MetersTableContent: React.FC<MetersTableContentProps> = ({
    filtersMeta,
    baseSearchQuery,
    canManageMeters,
    sortableProperties,
    loading,
    showImportButton = true,
}) => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const IsActiveMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.isActive' })
    const OutOfOrderMessage = intl.formatMessage({ id: 'pages.condo.meter.Meter.outOfOrder' })
    const VerificationStartMessage = intl.formatMessage({ id: 'pages.condo.meter.Verification.StartDate' })
    const VerificationEndMessage = intl.formatMessage({ id: 'pages.condo.meter.Verification.EndDate' })

    const router = useRouter()
    const { filters, offset, sorters, tab } = parseQuery(router.query)
    const type = get(router.query, 'type')
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, sortableProperties || SORTABLE_PROPERTIES)
    const tableColumns = useTableColumns(filtersMeta, METER_TAB_TYPES.meter, METER_TYPES.unit)

    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortMetersBy[], [sorters, sortersToSortBy])

    const [dateRange, setDateRange] = useDateRangeSearch('nextVerificationDate')
    const [filtersAreReset, setFiltersAreReset] = useState(false)
    const [isShowActiveMeters, setIsShowActiveMeters] = useState(() => getInitialArchivedOrActiveMeter(router, 'isShowActiveMeters', true))
    const [isShowArchivedMeters, setIsShowArchivedMeters] = useState(() => getInitialArchivedOrActiveMeter(router, 'isShowArchivedMeters'))

    const dateFallback = filtersAreReset ? null : DEFAULT_DATE_RANGE
    const dateFilterValue = dateRange
    const dateFilter = dateFilterValue ? dateFilterValue.map(el => el.toISOString()) : null

    const handleDateChange = useCallback((value) => {
        if (!value) {
            setFiltersAreReset(true)
            setDateRange(null)
        } else {
            setDateRange(value)
        }
    }, [setDateRange])

    const handleOnClickVerificationDate = useCallback(() => {
        if (!dateRange) setDateRange(dateFallback)
    }, [dateFallback, dateRange, setDateRange])

    const searchMetersQuery = useMemo(() => ({
        ...filtersToWhere({
            nextVerificationDate: dateFilter,
            ...filters,
        }),
        ...(isShowActiveMeters && !isShowArchivedMeters)  ? { archiveDate: null } : {},
        ...(isShowArchivedMeters && !isShowActiveMeters) ? { archiveDate_not: null } : {},
        ...baseSearchQuery,
    }), [baseSearchQuery, dateFilter, filters, filtersToWhere, isShowActiveMeters, isShowArchivedMeters])

    const {
        loading: meterReadingsLoading,
        count: total,
        objs: meters,
        refetch,
    } = MeterForOrganization.useObjects({
        sortBy,
        where: searchMetersQuery,
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
        extraQueryParameters: { tab, type },
    })

    const handleRowAction = useCallback((record) => {
        return {
            onClick: () => {
                router.push(`/meter/unit/${get(record, 'id')}`)
            },
        }
    }, [router])

    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])
    const handleUpdateMeterQuery = useCallback(async (newParameters: UpdateMeterQueryParamsType) => {
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false })
    }, [router])

    const handleCheckShowActiveMeters = useCallback(() => {
        handleUpdateMeterQuery({ isShowActiveMeters: String(!isShowActiveMeters), isShowArchivedMeters: String(isShowArchivedMeters) })
        setIsShowActiveMeters(prev => !prev)
    }, [handleUpdateMeterQuery, isShowActiveMeters, isShowArchivedMeters])

    const handleCheckShowArchiveMeters = useCallback(() => {
        handleUpdateMeterQuery({ isShowActiveMeters: String(isShowActiveMeters), isShowArchivedMeters: String(!isShowArchivedMeters) })
        setIsShowArchivedMeters(prev => !prev)
    }, [handleUpdateMeterQuery, isShowActiveMeters, isShowArchivedMeters])

    const { selectedKeys, clearSelection, rowSelection } = useTableRowSelection<typeof meters[number]>({ items: meters })
    const onDeleteCompleted = useCallback(async () => {
        clearSelection()
        await refetch()
    }, [clearSelection, refetch])

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
                                        <DateRangePicker
                                            value={dateRange}
                                            onChange={handleDateChange}
                                            placeholder={[VerificationStartMessage, VerificationEndMessage]}
                                            onClick={handleOnClickVerificationDate}
                                            size='large'
                                            disabledDate={_ => false}
                                            style={FULL_WIDTH_DATE_RANGE_STYLE}
                                        />
                                    </Col>
                                    <Col>
                                        <Row gutter={[16, 10]} align='middle' justify='end' style={{ flexWrap: 'nowrap' }}>
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
                            </Col>
                            <Col span={24}>
                                <Row gutter={FILTERS_CONTAINER_GUTTER} align='middle'>
                                    <Col>
                                        <Checkbox
                                            onChange={handleCheckShowActiveMeters}
                                            checked={isShowActiveMeters}
                                            data-cy='meter__filter-hasNullArchiveDate'
                                            children={IsActiveMessage}
                                        />
                                    </Col>
                                    <Col>
                                        <Checkbox
                                            onChange={handleCheckShowArchiveMeters}
                                            checked={isShowArchivedMeters}
                                            data-cy='meter__filter-hasArchiveDate'
                                            children={OutOfOrderMessage}
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    <Table
                        totalRows={total}
                        loading={meterReadingsLoading || loading}
                        dataSource={meters}
                        columns={tableColumns}
                        onRow={handleRowAction}
                        rowSelection={rowSelection}
                    />
                </Col>
                {
                    canManageMeters && (
                        selectedKeys.length > 0 ? (
                            <Col span={24}>
                                <ActionBarWithSelectedItems
                                    selectedKeys={selectedKeys}
                                    clearSelection={clearSelection}
                                    onDeleteCompleted={onDeleteCompleted}
                                />
                            </Col>
                        ) : (
                            <Col span={24}>
                                <DefaultMetersActionBar
                                    canManageMeters={canManageMeters}
                                    showImportButton={showImportButton}
                                    onImportFinish={refetch}
                                />
                            </Col>
                        )
                    )
                }
            </Row>
            <MultipleFiltersModal />
        </>
    )
}

type MeterReadingsPageContentProps = Omit<MetersTableContentProps, 'mutationErrorsToMessages'>

export const MetersPageContent: React.FC<MeterReadingsPageContentProps> = ({
    filtersMeta,
    baseSearchQuery,
    canManageMeters,
    loading,
    showImportButton = true,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.manualCreateCard.body.description' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })

    const { refetch } = MeterForOrganization.useCount({}, { skip: true })
    const { count, loading: countLoading } = MeterForOrganization.useCount({ where: baseSearchQuery })

    const PageContent = useMemo(() => {
        if (countLoading || loading) return <Loader />

        if (count === 0) {
            return (
                showImportButton ? (<EmptyListContent
                    label={EmptyListLabel}
                    importLayoutProps={{
                        manualCreateEmoji: EMOJI.CLOCK,
                        manualCreateDescription: EmptyListManualBodyDescription,
                        importCreateEmoji: EMOJI.LIST,
                        importWrapper: {
                            onFinish: refetch,
                            domainName: 'meter',
                        },
                        OverrideImportWrapperFC: MetersImportWrapper,
                    }}
                    createRoute={`/meter/create?tab=${METER_TAB_TYPES.meter}`}
                    accessCheck={canManageMeters}
                />) : (<EmptyListContent
                    label={EmptyListLabel}
                    createRoute={`/meter/create?tab=${METER_TAB_TYPES.meter}`}
                    createLabel={CreateMeter}
                    accessCheck={canManageMeters}
                />)

            )
        }

        return (
            <MetersTableContent
                filtersMeta={filtersMeta}
                baseSearchQuery={baseSearchQuery}
                canManageMeters={canManageMeters}
                loading={countLoading}
                showImportButton={showImportButton}
            />
        )
    }, [CreateMeter, EmptyListLabel, EmptyListManualBodyDescription, baseSearchQuery, canManageMeters, count, countLoading, filtersMeta, loading, refetch, showImportButton])

    return (
        <TablePageContent>
            {PageContent}
        </TablePageContent>
    )
}

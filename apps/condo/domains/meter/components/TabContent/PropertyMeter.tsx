import { useUpdatePropertyMetersMutation } from '@app/condo/gql'
import {
    MeterReadingWhereInput,
    SortPropertyMetersBy,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
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
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EMOJI } from '@condo/domains/common/constants/emoji'
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
    PropertyMeter,
    METER_TAB_TYPES,
    MeterReadingFilterTemplate,
    METER_TYPES,
} from '@condo/domains/meter/utils/clientSchema'
import { getInitialArchivedOrActiveMeter } from '@condo/domains/meter/utils/helpers'


const METERS_PAGE_CONTENT_ROW_GUTTERS: RowProps['gutter'] = [0, 40]
const FILTERS_CONTAINER_GUTTER: RowProps['gutter'] = [16, 16]
const RESET_FILTERS_BUTTON_STYLE: CSSProperties = { paddingLeft: 0 }
const QUICK_FILTERS_COL_STYLE: CSSProperties = { alignSelf: 'center' }

const SORTABLE_PROPERTIES = ['date', 'clientName', 'source']

type PropertyMetersTableContentProps = {
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

interface IDefaultPropertyMetersActionBarProps {
    canManageMeters: boolean
    showImportButton: boolean
    onImportFinish: () => void
}
const DefaultPropertyMetersActionBar: React.FC<IDefaultPropertyMetersActionBarProps> = ({ canManageMeters, showImportButton, onImportFinish }) => {
    const intl = useIntl()
    const CreatePropertyMeterButtonLabel = intl.formatMessage({ id: 'pages.condo.meter.index.CreateMeterButtonLabel' })

    const router = useRouter()
    const handleCreatePropertyMeterReadings = useCallback(() => router.push(`/meter/create?tab=${METER_TAB_TYPES.propertyMeter}`), [router])

    return (
        <ActionBar actions={[
            <Button
                key='create'
                type='primary'
                onClick={handleCreatePropertyMeterReadings}
            >
                {CreatePropertyMeterButtonLabel}
            </Button>,
            showImportButton && (
                <MetersImportWrapper
                    key='import'
                    accessCheck={canManageMeters}
                    onFinish={onImportFinish}
                    extraProps={{
                        isPropertyMeters: true,
                    }}
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
    const ConfirmDeleteManyPropertyMetersTitle = intl.formatMessage({ id: 'pages.condo.meter.ConfirmDeleteManyTitle' })
    const ConfirmDeleteManyPropertyMetersMessage = intl.formatMessage({ id: 'global.ImpossibleToRestore' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })

    const router = useRouter()
    const client = useApolloClient()

    const SelectedItemsMessage = useMemo(() => intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedKeys.length }), [intl, selectedKeys])

    const [updatePropertyMetersMutation] = useUpdatePropertyMetersMutation({
        onCompleted: async () => {
            await onDeleteCompleted()
        },
    })

    const updateSelectedPropertyMetersByChunks = useCallback(async (payload) => {
        if (!selectedKeys.length) return
        const propertyMetersToDelete = chunk(selectedKeys.map((key) => ({
            id: key,
            data: {
                dv: 1,
                sender: getClientSideSenderInfo(),
                ...payload,
            },
        })), 30)

        for (const itemsToDelete of propertyMetersToDelete) {
            await updatePropertyMetersMutation({
                variables: {
                    data: itemsToDelete,
                },
            })
        }

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allPropertyMeters' })
        client.cache.gc()
    }, [client.cache, selectedKeys, updatePropertyMetersMutation])

    const handleDeleteButtonClick = useCallback(async () => {
        const now = new Date().toISOString()
        await updateSelectedPropertyMetersByChunks({ deletedAt: now })
        await updateQuery(router, {
            newParameters: {
                offset: 0,
            },
        }, { routerAction: 'replace', resetOldParameters: false })
    }, [router, updateSelectedPropertyMetersByChunks])

    const selectedContactsActionBarButtons: ActionBarProps['actions'] = useMemo(() => [
        <DeleteButtonWithConfirmModal
            key='deleteSelectedPropertyMeters'
            title={ConfirmDeleteManyPropertyMetersTitle}
            message={ConfirmDeleteManyPropertyMetersMessage}
            okButtonLabel={DeleteMessage}
            action={handleDeleteButtonClick}
            buttonContent={DeleteMessage}
            cancelMessage={DontDeleteMessage}
            showCancelButton
            cancelButtonType='primary'
        />,
        <Button
            key='cancelPropertyMetersSelection'
            type='secondary'
            onClick={clearSelection}
        >
            {CancelSelectionMessage}
        </Button>,
    ], [
        ConfirmDeleteManyPropertyMetersTitle, ConfirmDeleteManyPropertyMetersMessage, DeleteMessage, handleDeleteButtonClick,
        DontDeleteMessage, clearSelection, CancelSelectionMessage,
    ])

    return (
        <ActionBar
            message={SelectedItemsMessage}
            actions={selectedContactsActionBarButtons}
        />
    )
}

const PropertyMetersTableContent: React.FC<PropertyMetersTableContentProps> = ({
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

    const router = useRouter()
    const { filters, offset, sorters, tab } = parseQuery(router.query)
    const type = get(router.query, 'type')

    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)

    const [isShowActiveMeters, setIsShowActiveMeters] = useState(() => getInitialArchivedOrActiveMeter(router, 'isShowActiveMeters', true))
    const [isShowArchivedMeters, setIsShowArchivedMeters] = useState(() => getInitialArchivedOrActiveMeter(router, 'isShowArchivedMeters'))

    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filtersMeta, sortableProperties || SORTABLE_PROPERTIES)
    const tableColumns = useTableColumns(filtersMeta, METER_TAB_TYPES.meter, METER_TYPES.property)

    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortPropertyMetersBy[], [sorters, sortersToSortBy])

    const searchPropertyMetersQuery = useMemo(() => ({
        ...filtersToWhere(filters),
        ...(isShowActiveMeters && !isShowArchivedMeters)  ? { archiveDate: null } : {},
        ...(isShowArchivedMeters && !isShowActiveMeters) ? { archiveDate_not: null } : {},
        ...baseSearchQuery,
    }), [baseSearchQuery, filters, filtersToWhere, isShowActiveMeters, isShowArchivedMeters])

    const {
        loading: propertyMetersLoading,
        count: total,
        objs: propertyMeters,
        refetch,
    } = PropertyMeter.useObjects({
        sortBy,
        where: searchPropertyMetersQuery,
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
                router.push(`/meter/property/${record.id}`)
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

    const { selectedKeys, clearSelection, rowSelection } = useTableRowSelection<typeof propertyMeters[number]>({ items: propertyMeters })
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
                            </Col>
                            <Col span={24}>
                                <Row justify='start' gutter={FILTERS_CONTAINER_GUTTER} style={{ flexWrap: 'nowrap' }}>
                                    <Col style={QUICK_FILTERS_COL_STYLE}>
                                        <Checkbox
                                            onChange={handleCheckShowActiveMeters}
                                            checked={isShowActiveMeters}
                                            data-cy='meter__filter-hasNullArchiveDate'
                                            children={IsActiveMessage}
                                        />
                                    </Col>
                                    <Col style={QUICK_FILTERS_COL_STYLE}>
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
                        loading={propertyMetersLoading || loading}
                        dataSource={propertyMeters}
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
                                <DefaultPropertyMetersActionBar
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

type PropertyMeterReadingsPageContentProps = Omit<PropertyMetersTableContentProps, 'mutationErrorsToMessages'>

export const PropertyMetersPageContent: React.FC<PropertyMeterReadingsPageContentProps> = ({
    filtersMeta,
    baseSearchQuery,
    canManageMeters,
    loading,
    showImportButton = true,
}) => {
    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.propertyMeter.index.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'pages.condo.meter.index.EmptyList.manualCreateCard.body.description' })
    const CreateMeter = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })

    const { refetch } = PropertyMeter.useCount({}, { skip: true })
    const { count, loading: countLoading } = PropertyMeter.useCount({ where: baseSearchQuery })

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
                            domainName: 'propertyMeter',
                            extraProps: {
                                isPropertyMeters: true,
                            },
                        },
                        OverrideImportWrapperFC: MetersImportWrapper,
                    }}
                    createRoute={`/meter/create?tab=${METER_TAB_TYPES.propertyMeter}`}
                    accessCheck={canManageMeters}
                />) : (<EmptyListContent
                    label={EmptyListLabel}
                    createRoute={`/meter/create?tab=${METER_TAB_TYPES.propertyMeter}`}
                    createLabel={CreateMeter}
                    accessCheck={canManageMeters}
                />)

            )
        }

        return (
            <PropertyMetersTableContent
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

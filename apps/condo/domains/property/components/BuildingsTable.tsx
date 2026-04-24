import { useLazyQuery } from '@apollo/client'
import { useUpdatePropertiesMutation } from '@app/condo/gql'
import {
    OrganizationEmployeeRole, Property as PropertyType,
    PropertyWhereInput, QueryAllPropertiesArgs,
    SortPropertiesBy,
} from '@app/condo/schema'
import { Col, notification, Row } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import { ColumnsType } from 'antd/lib/table'
import chunk from 'lodash/chunk'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { IRefetchType } from '@open-condo/codegen/generate.hooks'
import { Search } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, ActionBarProps, Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { ImportWrapper } from '@condo/domains/common/components/Import/Index'
import { Loader } from '@condo/domains/common/components/Loader'
import { Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { EMOJI } from '@condo/domains/common/constants/emoji'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useTableRowSelection } from '@condo/domains/common/hooks/useTableRowSelection'
import { FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { EXPORT_PROPERTIES_TO_EXCEL } from '@condo/domains/property/gql'
import { useImporterFunctions } from '@condo/domains/property/hooks/useImporterFunctions'
import { PropertyTable } from '@condo/domains/property/utils/clientSchema'
import { IFilters, PROPERTY_PAGE_SIZE } from '@condo/domains/property/utils/helpers'


type BuildingTableProps = {
    role: Pick<OrganizationEmployeeRole, 'canManageProperties' | 'canReadProperties'>
    baseSearchQuery: PropertyWhereInput
    tableColumns: ColumnsType
    propertyFilterMeta: FiltersMeta<PropertyWhereInput>[]
    loading?: boolean
    canDownloadProperties?: boolean
}

const ROW_VERTICAL_GUTTERS: [Gutter, Gutter] = [0, 40]

type DefaultActionBarProps = {
    searchPropertiesQuery: PropertyWhereInput
    sortBy: SortPropertiesBy[]
    refetch: IRefetchType<PropertyType, QueryAllPropertiesArgs>
    canManageProperties: boolean
    isDownloadButtonHidden: boolean
}
const DefaultActionBar: React.FC<DefaultActionBarProps> = ({
    searchPropertiesQuery,
    sortBy,
    refetch,
    canManageProperties,
    isDownloadButtonHidden,
}) => {
    const intl = useIntl()
    const ExportAsExcel = intl.formatMessage({ id: 'ExportAsExcel' })
    const CreateLabel = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })
    const DownloadExcelLabel = intl.formatMessage({ id: 'pages.condo.property.id.DownloadExcelLabel' })

    const router = useRouter()

    const [downloadLink, setDownloadLink] = useState(null)

    const [exportToExcel, { loading: isXlsLoading }] = useLazyQuery(
        EXPORT_PROPERTIES_TO_EXCEL,
        {
            onError: error => {
                const message = error?.graphQLErrors?.[0]?.extensions?.messageForUser  as string || error?.message
                notification.error({ message })
            },
            onCompleted: data => {
                setDownloadLink(data.result.linkToFile)
            },
        },
    )

    const [columns, propertyNormalizer, propertyValidator, propertyCreator] = useImporterFunctions()

    const onExportToExcelButtonClicked = useCallback(async () => {
        await exportToExcel({
            variables: {
                data: {
                    where: { ...searchPropertiesQuery },
                    sortBy,
                },
            },
        })
    }, [exportToExcel, searchPropertiesQuery, sortBy])

    const actionBarButtons: ActionBarProps['actions'] = useMemo(() => [
        canManageProperties && (
            <>
                <Button
                    type='primary'
                    onClick={async () => await router.push('/property/create')}
                >
                    {CreateLabel}
                </Button>
                <ImportWrapper
                    accessCheck={canManageProperties}
                    onFinish={refetch}
                    columns={columns}
                    rowNormalizer={propertyNormalizer}
                    rowValidator={propertyValidator}
                    objectCreator={propertyCreator}
                    domainName='property'
                />
            </>
        ),
        !isDownloadButtonHidden && (
            downloadLink
                ? (
                    <Button
                        type='secondary'
                        loading={isXlsLoading}
                        target='_blank'
                        href={downloadLink}
                        rel='noreferrer'>
                        {DownloadExcelLabel}
                    </Button>
                )
                : (
                    <Button
                        type='secondary'
                        loading={isXlsLoading}
                        onClick={onExportToExcelButtonClicked}>
                        {ExportAsExcel}
                    </Button>
                )
        ),
    ], [
        CreateLabel, DownloadExcelLabel, ExportAsExcel, canManageProperties, columns, downloadLink,
        isDownloadButtonHidden, isXlsLoading, onExportToExcelButtonClicked, propertyCreator, propertyNormalizer,
        propertyValidator, refetch, router,
    ])

    if (!actionBarButtons || actionBarButtons?.length === 0) {
        return null
    }

    return (
        <Col span={24}>
            <ActionBar actions={actionBarButtons}/>
        </Col>
    )
}

type ActionBarWithSelectedItemsProps = {
    selectedKeys: string[]
    clearSelection: () => void
    refetch: IRefetchType<PropertyType, QueryAllPropertiesArgs>
    canManageProperties: boolean
}
const ActionBarWithSelectedItems: React.FC<ActionBarWithSelectedItemsProps> = ({
    selectedKeys,
    clearSelection,
    refetch,
    canManageProperties,
}) => {
    const intl = useIntl()
    const CancelSelectionMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const ConfirmDeleteManyPropertiesTitle = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteManyTitle' })
    const ConfirmDeleteManyPropertiesMessage = intl.formatMessage({ id: 'pages.condo.property.form.ConfirmDeleteMessage' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })
    const SelectedItemsMessage = useMemo(() => intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedKeys.length }), [intl, selectedKeys])

    const client = useApolloClient()
    const router = useRouter()

    const [updatePropertiesMutation] = useUpdatePropertiesMutation({
        onCompleted: async () => {
            clearSelection()
            await updateQuery(router, {
                newParameters: {
                    offset: 0,
                },
            }, { routerAction: 'replace', resetOldParameters: false })
            await refetch()
        },
    })

    const softDeleteSelectedPropertiesByChunks = useCallback(async () => {
        if (!selectedKeys.length) return

        const now = new Date().toISOString()
        const itemsToDeleteByChunks = chunk(selectedKeys.map((key) => ({
            id: key,
            data: {
                dv: 1,
                sender: getClientSideSenderInfo(),
                deletedAt: now,
            },
        })), 30)

        for (const itemsToDelete of itemsToDeleteByChunks) {
            await updatePropertiesMutation({
                variables: {
                    data: itemsToDelete,
                },
            })
        }

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allProperties' })
        client.cache.gc()
    }, [client?.cache, selectedKeys, updatePropertiesMutation])

    const selectedPropertiesActionBarButtons: ActionBarProps['actions'] = useMemo(() => [
        canManageProperties && (
            <DeleteButtonWithConfirmModal
                key='deleteSelectedContacts'
                title={ConfirmDeleteManyPropertiesTitle}
                message={ConfirmDeleteManyPropertiesMessage}
                okButtonLabel={DeleteMessage}
                action={softDeleteSelectedPropertiesByChunks}
                buttonContent={DeleteMessage}
                cancelMessage={DontDeleteMessage}
                showCancelButton
                cancelButtonType='primary'
            />
        ),
        <Button
            key='cancelPropertiesSelection'
            type='secondary'
            onClick={clearSelection}
        >
            {CancelSelectionMessage}
        </Button>,
    ], [CancelSelectionMessage, ConfirmDeleteManyPropertiesMessage, ConfirmDeleteManyPropertiesTitle, DeleteMessage, DontDeleteMessage, canManageProperties, clearSelection, softDeleteSelectedPropertiesByChunks])

    if (!canManageProperties) {
        return null
    }

    return (
        <Col span={24}>
            <ActionBar
                message={SelectedItemsMessage}
                actions={selectedPropertiesActionBarButtons}
            />
        </Col>
    )
}

const BuildingTableContent: React.FC<BuildingTableProps> = (props) => {
    const {
        role,
        tableColumns,
        loading,
        canDownloadProperties,
        baseSearchQuery,
        propertyFilterMeta,
    } = props

    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    const router = useRouter()
    const { filters, sorters, offset } = parseQuery(router.query)

    const {
        filtersToWhere: filtersToPropertiesWhere,
        sortersToSortBy: sortersToSortPropertiesBy,
    } = useQueryMappers<PropertyWhereInput>(propertyFilterMeta, ['address', 'createdAt'])

    const searchPropertiesQuery = useMemo(() => ({
        ...filtersToPropertiesWhere(filters),
        ...baseSearchQuery,
    }), [baseSearchQuery, filters, filtersToPropertiesWhere])
    const sortBy = sortersToSortPropertiesBy(sorters) as SortPropertiesBy[]
    const currentPageIndex = getPageIndexFromOffset(offset, PROPERTY_PAGE_SIZE)

    const { loading: propertiesLoading, refetch, objs: properties, count: total } = PropertyTable.useObjects({
        sortBy,
        where: { ...searchPropertiesQuery },
        skip: (currentPageIndex - 1) * PROPERTY_PAGE_SIZE,
        first: PROPERTY_PAGE_SIZE,
    })

    const handleRowAction = useCallback((record) => {
        return {
            onClick: async () => {
                await router.push(`/property/${record.id}`)
            },
        }
    }, [router])

    const { selectedKeys, clearSelection, rowSelection } = useTableRowSelection<typeof properties[number]>({ items: properties })

    const [search, handleSearchChange] = useSearch<IFilters>()

    const canManageProperties = role?.canManageProperties
    const isDownloadButtonHidden = !(role?.canReadProperties || canDownloadProperties)

    return (
        <Row justify='space-between' gutter={ROW_VERTICAL_GUTTERS}>
            <Col span={24}>
                <TableFiltersContainer>
                    <Input
                        placeholder={SearchPlaceholder}
                        onChange={(e) => {
                            handleSearchChange(e.target.value)
                        }}
                        value={search}
                        allowClear={true}
                        suffix={<Search size='medium' color={colors.gray[7]} />}
                    />
                </TableFiltersContainer>
            </Col>
            <Col span={24}>
                <Table
                    totalRows={total}
                    loading={propertiesLoading || loading}
                    dataSource={properties}
                    onRow={handleRowAction}
                    columns={tableColumns}
                    pageSize={PROPERTY_PAGE_SIZE}
                    data-cy='property__table'
                    rowSelection={canManageProperties && rowSelection}
                />
            </Col>
            {
                selectedKeys?.length > 0 ? (
                    <ActionBarWithSelectedItems
                        selectedKeys={selectedKeys}
                        clearSelection={clearSelection}
                        refetch={refetch}
                        canManageProperties={canManageProperties}
                    />
                ) : (
                    <DefaultActionBar
                        searchPropertiesQuery={searchPropertiesQuery}
                        sortBy={sortBy}
                        refetch={refetch}
                        canManageProperties={canManageProperties}
                        isDownloadButtonHidden={isDownloadButtonHidden}
                    />
                )
            }
        </Row>
    )
}

export default function BuildingsTable (props: BuildingTableProps) {
    const { role, baseSearchQuery, loading } = props

    const intl = useIntl()
    const EmptyListLabel = intl.formatMessage({ id: 'pages.condo.property.index.EmptyList.header' })
    const EmptyListManualBodyDescription = intl.formatMessage({ id: 'pages.condo.property.index.EmptyList.manualCreateCard.body.description' })

    const [columns, propertyNormalizer, propertyValidator, propertyCreator] = useImporterFunctions()

    const canManageProperties = role?.canManageProperties || false

    const { count, loading: propertiesCountLoading } = PropertyTable.useCount({ where: baseSearchQuery })
    const { refetch } = PropertyTable.useObjects({ where: baseSearchQuery }, { skip: true })

    if (propertiesCountLoading || loading) {
        return <Loader />
    }

    if (count === 0) {
        return <EmptyListContent
            label={EmptyListLabel}
            accessCheck={canManageProperties}
            createRoute='/property/create'
            importLayoutProps={{
                manualCreateEmoji: EMOJI.HOUSE,
                manualCreateDescription: EmptyListManualBodyDescription,
                importCreateEmoji: EMOJI.HOUSES,
                importWrapper: {
                    onFinish: refetch,
                    columns: columns,
                    rowNormalizer: propertyNormalizer,
                    rowValidator: propertyValidator,
                    objectCreator: propertyCreator,
                    domainName: 'property',
                },
            }}
        />
    }

    return (
        <BuildingTableContent {...props} />
    )
}

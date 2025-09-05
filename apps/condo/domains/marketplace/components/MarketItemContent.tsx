import { useUpdateMarketItemsMutation } from '@app/condo/gql'
import { SortMarketItemsBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import chunk from 'lodash/chunk'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, ActionBarProps, Button, Select } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { DeleteButtonWithConfirmModal } from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { useTableRowSelection } from '@condo/domains/common/hooks/useTableRowSelection'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useMarketplaceServicesFilters } from '@condo/domains/marketplace/hooks/useMarketplaceServicesFilters'
import { useMarketplaceServicesTableColumns } from '@condo/domains/marketplace/hooks/useMarketplaceServicesTableColumns'
import { MarketItem, MarketPriceScope, MarketCategory } from '@condo/domains/marketplace/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'


interface IMarketItemContentActionBarProps {
    selectedKeys: string[]
    clearSelection: () => void
    onDeleteMarketItems: () => Promise<void>
}

const MarketItemContentActionBar: React.FC<IMarketItemContentActionBarProps> = ({
    selectedKeys,
    clearSelection,
    onDeleteMarketItems,
}) => {
    const intl = useIntl()
    const AddServicesButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.services.actionBar.createMarketItemButton' })
    const CancelSelectionMessage = intl.formatMessage({ id: 'global.cancelSelection' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })
    const DontDeleteMessage = intl.formatMessage({ id: 'DontDelete' })
    const SelectedItemsMessage = useMemo(() => intl.formatMessage({ id: 'ItemsSelectedCount' }, { count: selectedKeys.length }), [intl, selectedKeys])
    const ConfirmDeleteManyPropertiesTitle = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.DeleteManyTitle' })
    const ConfirmDeleteManyPropertiesMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.ConfirmDeleteMessage' })
    const DeleteButtonLabel = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.DeleteManyTitle' })

    const router = useRouter()
    const client = useApolloClient()

    const defaultActionBarContent: ActionBarProps['actions'] = useMemo(() => [
        <Button
            key='createMarketItem'
            type='primary'
            onClick={() => { router.push('/marketplace/marketItem/create') }}
        >
            {AddServicesButtonText}
        </Button>,
    ], [AddServicesButtonText, router])

    const [updateMarketItems] = useUpdateMarketItemsMutation({
        onCompleted: async () => {
            clearSelection()
            await updateQuery(router, {
                newParameters: {
                    offset: 0,
                },
            }, { routerAction: 'replace', resetOldParameters: false })
            await onDeleteMarketItems()
        },
    })

    const softDeleteMarketItemsByChunks = useCallback(async () => {
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
            await updateMarketItems({
                variables: {
                    data: itemsToDelete,
                },
            })
        }

        client.cache.evict({ id: 'ROOT_QUERY', fieldName: 'allMarketItems' })
        client.cache.gc()
    }, [client?.cache, selectedKeys, updateMarketItems])

    const selectedItemsActionBarContent: ActionBarProps['actions'] = useMemo(() => [
        <DeleteButtonWithConfirmModal
            key='deleteSelectedMarketItems'
            title={ConfirmDeleteManyPropertiesTitle}
            message={ConfirmDeleteManyPropertiesMessage}
            okButtonLabel={DeleteMessage}
            action={softDeleteMarketItemsByChunks}
            buttonContent={DeleteMessage}
            cancelMessage={DontDeleteMessage}
            showCancelButton
            cancelButtonType='primary'
        />,
        <Button
            key='cancelMarketItemsSelection'
            type='secondary'
            onClick={clearSelection}
        >
            {CancelSelectionMessage}
        </Button>,
    ], [
        CancelSelectionMessage, ConfirmDeleteManyPropertiesMessage, ConfirmDeleteManyPropertiesTitle,
        DeleteButtonLabel, DeleteMessage, DontDeleteMessage, clearSelection, softDeleteMarketItemsByChunks,
    ])

    const actions = useMemo(() => selectedKeys.length > 0 ?
        selectedItemsActionBarContent : defaultActionBarContent,
    [defaultActionBarContent, selectedItemsActionBarContent, selectedKeys.length])

    const actionBarMessage = useMemo(() => selectedKeys.length > 0 && SelectedItemsMessage,
        [SelectedItemsMessage, selectedKeys.length])

    return (
        <ActionBar
            message={actionBarMessage}
            actions={actions}
        />
    )
}

const TableContent = () => {
    const intl = useIntl()
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const AllCategoriesMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.filter.allCategories' })

    const router = useRouter()
    const { organization, link } = useOrganization()
    const orgId = get(organization, 'id', null)
    const role = get(link, 'role', {})
    const canManageMarketItems = get(role, 'canManageMarketItems', false)

    const {
        objs: marketCategories,
        loading: marketCategoriesLoading,
    } = MarketCategory.useAllObjects({
        where: {},
    })

    const categoriesWithOneSubCategory = useMemo(() => marketCategories.map(category => {
        const categoriesWithParent = marketCategories.filter(otherCategory =>
            get(otherCategory, 'parentCategory.id') === category.id
        )

        if (categoriesWithParent.length === 1) {
            return category.id
        }
    }).filter(Boolean), [marketCategories])

    const {
        objs: organizationMarketItems,
    } = MarketItem.useAllObjects({
        where: {
            organization: {
                id: orgId,
            },
        },
    }, {
        skip: !orgId,
    })

    const categoriesInMarketItems = useMemo(() =>
        uniqBy(organizationMarketItems.map(marketItem => get(marketItem, 'marketCategory')), 'id')
    , [organizationMarketItems])

    const categorySelectOptions = useMemo(() => {
        const groups = []

        groups.push({ label: AllCategoriesMessage, value: 'all', order: 0 })

        for (const category of categoriesInMarketItems) {
            const categoryId = get(category, 'id')
            const parentCategoryId = get(category, 'parentCategory.id')
            const isNewOptGroup = !groups.some(group => group.key === parentCategoryId)

            if (categoriesWithOneSubCategory.includes(parentCategoryId) && isNewOptGroup) {
                groups.push({
                    key: parentCategoryId,
                    label: get(category, 'parentCategory.name'),
                    value: categoryId,
                    order: get(category, 'parentCategory.order'),
                })
            } else {
                const categoryOption = {
                    label: get(category, 'name'),
                    value: categoryId,
                    key: categoryId,
                    order: get(category, 'order'),
                }

                if (isNewOptGroup) {
                    groups.push({
                        key: parentCategoryId,
                        label: get(category, 'parentCategory.name'),
                        order: get(category, 'parentCategory.order'),
                        options: [categoryOption],
                    })
                } else {
                    const existedGroup = groups.find(group => group.key === parentCategoryId)

                    if (existedGroup.options) {
                        existedGroup.options.push(categoryOption)
                    }
                }
            }
        }

        groups
            .sort((a, b) => {
                if (a.label === AllCategoriesMessage) return -1

                return a.label > b.label ? 1 : -1
            })
            .sort((a, b) => a.order > b.order ? 1 : -1)
        groups.forEach(group => {
            group.options && group.options
                .sort((a, b) => a.label > b.label ? 1 : -1)
                .sort((a, b) => a.order > b.order ? 1 : -1)
        })

        return groups
    }, [AllCategoriesMessage, categoriesInMarketItems, categoriesWithOneSubCategory])

    const { filters, offset, sorters } = parseQuery(router.query)
    const filtersFromQuery = useMemo(() => getFiltersFromQuery(router.query), [router.query])
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const queryMetas = useMarketplaceServicesFilters({ categorySelectOptions })
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, ['sku', 'name'])
    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortMarketItemsBy[], [sorters, sortersToSortBy])

    const { count: propertiesCount } = Property.useCount({
        where: {
            organization: { id: orgId },
        },
    }, { skip: !orgId })

    const { objs: properties } = Property.useObjects(
        {
            where: {
                organization: { id: orgId },
            },
        }, { skip: propertiesCount !== 1 }
    )

    const {
        loading: marketItemsLoading,
        count: total,
        objs: marketItems,
        refetch,
    } = MarketItem.useObjects({
        sortBy,
        where: {
            organization: {
                id: orgId,
            },
            ...filtersToWhere(filters),
        },
        first: DEFAULT_PAGE_SIZE,
        skip: (currentPageIndex - 1) * DEFAULT_PAGE_SIZE,
    }, {
        skip: !orgId,
    })

    const {
        objs: marketPriceScopes,
    } = MarketPriceScope.useAllObjects({
        where: {
            marketItemPrice: {
                marketItem: { id_in: marketItems.map(({ id }) => id) },
            },
        },
    }, {
        skip: isEmpty(marketItems),
    })

    const tableColumns = useMarketplaceServicesTableColumns(queryMetas, marketPriceScopes, marketCategories, properties)

    const [search, handleSearchChange] = useSearch()
    const handleSearch = useCallback((e) => handleSearchChange(e.target.value), [handleSearchChange])

    const categoryValueFromQuery = get(filtersFromQuery, 'marketCategory')
    const handleCategorySelectChange = useCallback(async (value) => {
        let newFilters = Object.assign({}, filtersFromQuery)
        if (value === 'all') {
            newFilters = omit(newFilters, 'marketCategory')
        } else {
            newFilters = { ...newFilters, marketCategory: value }
        }

        const newParameters = getFiltersQueryData(newFilters)
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false, shallow: true })
    }, [filtersFromQuery, router])

    const handleRowClick = useCallback((row) => {
        return {
            onClick: () => {
                router.push(`/marketplace/marketItem/${row.id}`)
            },
        }
    }, [router])

    const {
        selectedKeys,
        clearSelection,
        rowSelection,
    } = useTableRowSelection<typeof marketItems[number]>({ items: marketItems })

    const onDeleteMarketItems = useCallback(async () => {
        await refetch()
    }, [refetch])

    return (
        <TablePageContent>
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <TableFiltersContainer>
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Input
                                    placeholder={SearchPlaceholder}
                                    onChange={handleSearch}
                                    value={search}
                                    allowClear
                                />
                            </Col>
                            <Col span={24} md={14} lg={10} xl={8} xxl={6}>
                                <Select
                                    options={categorySelectOptions}
                                    onChange={handleCategorySelectChange}
                                    value={categoryValueFromQuery ? categoryValueFromQuery : 'all'}
                                    loading={marketCategoriesLoading}
                                />
                            </Col>
                        </Row>
                    </TableFiltersContainer>
                </Col>
                <Col span={24}>
                    <Row
                        align='middle'
                        justify='center'
                    >
                        <Col span={24}>
                            <Table
                                totalRows={total}
                                loading={marketItemsLoading}
                                dataSource={marketItems}
                                columns={tableColumns}
                                onRow={handleRowClick}
                                rowSelection={canManageMarketItems && rowSelection}
                            />
                        </Col>
                    </Row>
                </Col>
                {
                    canManageMarketItems && (
                        <Col span={24}>
                            <MarketItemContentActionBar
                                selectedKeys={selectedKeys}
                                clearSelection={clearSelection}
                                onDeleteMarketItems={onDeleteMarketItems}
                            />
                        </Col>
                    )
                }
            </Row>
        </TablePageContent>
    )
}

export const MarketplaceItemsContent = () => {
    const intl = useIntl()
    const ServicesEmptyTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.title' })
    const ServicesEmptyText = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.text' })
    const ServicesEmptyButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.buttonText' })

    const router = useRouter()
    const { organization, link } = useOrganization()
    const orgId = get(organization, 'id', null)
    const role = get(link, 'role', {})

    const canReadMarketItems = get(role, 'canReadMarketItems', false)

    const { count, loading } = MarketItem.useCount({
        where: {
            organization: { id: orgId },
        },
    })

    if (loading) {
        return (
            <LoadingOrErrorPage
                loading={loading}
            />
        )
    }

    if (count === 0) {
        return (
            <EmptyListContent
                label={ServicesEmptyTitle}
                message={ServicesEmptyText}
                button={
                    <Button onClick={() => router.push('/marketplace/marketItem/create')} type='primary'>{ServicesEmptyButtonText}</Button>
                }
                accessCheck={canReadMarketItems}
            />
        )
    }

    return <TableContent />
}
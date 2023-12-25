import { SortMarketItemsBy } from '@app/condo/schema'
import { Col, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import uniqBy from 'lodash/uniqBy'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Select } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import EmptyListView from '@condo/domains/common/components/EmptyListView'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getFiltersQueryData } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery, updateQuery } from '@condo/domains/common/utils/helpers'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useMarketplaceServicesFilters } from '@condo/domains/marketplace/hooks/useMarketplaceServicesFilters'
import { useMarketplaceServicesTableColumns } from '@condo/domains/marketplace/hooks/useMarketplaceServicesTableColumns'
import { MarketItem, MarketPriceScope, MarketCategory } from '@condo/domains/marketplace/utils/clientSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'


const TableContent = () => {
    const intl = useIntl()
    const AddServicesButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.services.actionBar.createMarketItemButton' })
    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })
    const AllCategoriesMessage = intl.formatMessage({ id: 'pages.condo.marketplace.marketItem.filter.allCategories' })

    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)

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

        groups.push({ label: AllCategoriesMessage, value: 'all' })

        for (const category of categoriesInMarketItems) {
            const categoryId = get(category, 'id')
            const parentCategoryId = get(category, 'parentCategory.id')
            const isNewOptGroup = !groups.some(group => group.key === parentCategoryId)

            if (categoriesWithOneSubCategory.includes(parentCategoryId) && isNewOptGroup) {
                groups.push({ key: parentCategoryId, label: get(category, 'parentCategory.name'), value: categoryId })
            } else {
                const categoryOption = {
                    label: get(category, 'name'),
                    value: categoryId,
                    key: categoryId,
                }

                if (isNewOptGroup) {
                    groups.push({ key: parentCategoryId, label: get(category, 'parentCategory.name'), options: [categoryOption] })
                } else {
                    const existedGroup = groups.find(group => group.key === parentCategoryId)

                    if (existedGroup.options) {
                        existedGroup.options.push(categoryOption)
                    }
                }
            }
        }

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
        await updateQuery(router, { newParameters }, { routerAction: 'replace', resetOldParameters: false })
    }, [filtersFromQuery, router])

    const handleRowClick = useCallback((row) => {
        return {
            onClick: () => {
                router.push(`/marketplace/marketItem/${row.id}`)
            },
        }
    }, [router])

    return (
        <TablePageContent>
            <Col span={24} style={{ 'marginBottom': '10px' }}>
                <TableFiltersContainer>
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={7}>
                            <Input
                                placeholder={SearchPlaceholder}
                                onChange={handleSearch}
                                value={search}
                                allowClear
                            />
                        </Col>
                        <Col xs={24} lg={5}>
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
                    />
                </Col>
            </Row>
            <ActionBar
                actions={[
                    <Button
                        key='createMarketItem'
                        type='primary'
                        onClick={() => { router.push('/marketplace/marketItem/create') }}
                    >
                        {AddServicesButtonText}
                    </Button>,
                ]}
            />

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
            <EmptyListView
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
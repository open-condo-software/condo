import { useApolloClient, useQuery } from '@apollo/client'
import {
    MarketItem as MarketItemType, SortMarketItemsBy,
} from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import EmptyListView from '@condo/domains/common/components/EmptyListView'
import { DEFAULT_PAGE_SIZE, Table } from '@condo/domains/common/components/Table/Index'
import { TableFiltersContainer } from '@condo/domains/common/components/TableFiltersContainer'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { getPageIndexFromOffset, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useMarketplaceServicesFilters } from '@condo/domains/marketplace/hooks/useMarketplaceServicesFilters'
import { useMarketplaceServicesTableColumns } from '@condo/domains/marketplace/hooks/useMarketplaceServicesTableColumns'
import { MarketItem, MarketPriceScope, MarketCategory } from '@condo/domains/marketplace/utils/clientSchema'


export const MarketplaceItemsContent = () => {
    const intl = useIntl()
    const ServicesEmptyTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.title' })
    const ServicesEmptyText = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.text' })
    const ServicesEmptyButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.buttonText' })
    const AddServicesButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.services.actionBar.createMarketItemButton' })

    const SearchPlaceholder = intl.formatMessage({ id: 'filters.FullSearch' })

    const router = useRouter()
    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const role = get(userOrganization, ['link', 'role'], {})

    const { filters, offset, sorters } = parseQuery(router.query)
    const currentPageIndex = getPageIndexFromOffset(offset, DEFAULT_PAGE_SIZE)
    const canReadMarketItems = get(role, 'canReadMarketItems', false)

    const queryMetas = useMarketplaceServicesFilters()
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(queryMetas, [])

    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortMarketItemsBy[], [sorters, sortersToSortBy])

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
        fetchPolicy: 'network-only',
    })

    const {
        loading: marketPriceScopesLoading,
        count: totalScopes,
        objs: marketPriceScopes,
        refetch: refetchScope,
    } = MarketPriceScope.useAllObjects({
        where: {
            marketItemPrice: {
                marketItem: { id_in: marketItems.map(({ id }) => id) },
            },
        },
    }, {
        fetchPolicy: 'network-only',
        skip: isEmpty(marketItems),
    })

    const {
        loading: marketCategoriesLoading,
        count: totalMarketCategories,
        objs: marketCategories,
        refetch: refetchCategories,
    } = MarketCategory.useObjects({
        where: {},
    }, {
        fetchPolicy: 'cache-first',
    })

    const tableColumns = useMarketplaceServicesTableColumns(queryMetas, marketPriceScopes, marketCategories)

    const [search, handleSearchChange] = useSearch()
    const handleSearch = useCallback((e) => {handleSearchChange(e.target.value)}, [handleSearchChange])
    const isNoMarketItemsData = isEmpty(marketItems) && isEmpty(filters) && !marketItemsLoading

    const handleRowClick = useCallback((row) => {
        return {
            onClick: () => {
                router.push(`/marketplace/marketItem/${row.id}`)
            },
        }
    }, [])

    if (isNoMarketItemsData) {
        return (<EmptyListView
            label={ServicesEmptyTitle}
            message={ServicesEmptyText}
            button={
                <Button onClick={() => router.push('/marketplace/marketItem/create')} type='primary'>{ServicesEmptyButtonText}</Button>
            }
            containerStyle={{ display: isNoMarketItemsData ? 'flex' : 'none' }}
            accessCheck={canReadMarketItems}
        />)
    }

    return (
        <TablePageContent>
            <Col span={24} style={{ 'marginBottom': '10px' }}>
                <TableFiltersContainer>
                    <Row justify='space-between'>
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
            <Row
                align='middle'
                justify='center'
                hidden={isNoMarketItemsData}
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
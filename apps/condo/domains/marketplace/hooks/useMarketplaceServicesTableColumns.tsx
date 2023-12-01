import {
    MarketPriceScope as MarketPriceScopeType,
    MarketCategory as MarketCategoryType,
} from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getTableCellRenderer, getMoneyRender, getAddressRender,
} from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'


export function useMarketplaceServicesTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, marketPriceScopes: MarketPriceScopeType[], marketCategories: MarketCategoryType[]) {
    const intl = useIntl()
    const SkuTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.sku' })
    const SkuNameTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.name' })
    const CategoryTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.category' })
    const ScopeTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.addressesAndPrices' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const search = getFilteredValue(filters, 'search')
    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    const processedScopes = {}
    for (const scope of marketPriceScopes) {
        const { marketItemPrice: { marketItem: { id }, price }, property: { addressMeta: { data: { street_with_type, house_type, house } } }  } = scope

        const item = {
            price: get(price[0], 'price'), 
            currency: get(price, 'currencyCode', 'RUB'), 
            address: `(${street_with_type}, ${house_type}. ${house})`,
        }
        
        if (Array.isArray(processedScopes[id])) processedScopes[id] = [...processedScopes[id], item]
        processedScopes[id] = [item]
    }

    return useMemo(() => {
        return [
            {
                title: SkuTitle,
                sortOrder: get(sorterMap, 'sku'),
                filteredValue: getFilteredValue(filters, 'sku'),
                key: 'sku',
                dataIndex: 'sku',
                sorter: true,
                width: '10%',
                render: render,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'sku'),
            },
            {
                title: SkuNameTitle,
                filteredValue: getFilteredValue(filters, 'name'),
                key: 'name',
                dataIndex: 'name',
                width: '23%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                render: render,
                filterIcon: getFilterIcon,
            },
            {
                title: CategoryTitle,
                filteredValue: getFilteredValue(filters, 'category'),
                key: 'category',
                dataIndex: 'marketCategory',
                width: '23%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'category'),
                render: (category) => {
                    const categoryName = intl.formatMessage( { id: `marketplace.marketCategory.${category.name}.name` })

                    if (category.parentCategory) {
                        const parentCategoryName = intl.formatMessage( { id: `marketplace.marketCategory.${category.parentCategory.name}.name` })
                        return render(`${parentCategoryName}»${categoryName}`)
                    }
                    return render(categoryName)
                },
                filterIcon: getFilterIcon,
            },
            {
                title: ScopeTitle,
                key: 'scope',
                width: '23%',
                render: (marketItem) => {
                    return Array.isArray(processedScopes[marketItem.id]) ? processedScopes[marketItem.id].map(scope => (<>
                        {getMoneyRender(intl, get(scope, 'currency', 'RUB'))(get(scope, 'price', '0'))}
                        <Typography.Text type='secondary' style={{ margin: '10px' }}>{get(scope, 'address')}</Typography.Text>
                    </>)) : ''
                },
                filterIcon: getFilterIcon,
            },
        ]
    }, [sorterMap, filters, intl, search, filterMetas, ScopeTitle, CategoryTitle, SkuNameTitle, SkuTitle])
}

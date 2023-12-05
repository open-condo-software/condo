import {
    MarketPriceScope as MarketPriceScopeType,
    MarketCategory as MarketCategoryType,
} from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import isNil from 'lodash/isNil'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getTableCellRenderer, getMoneyRender,
} from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getAddressDetails, getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'


export function useMarketplaceServicesTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, marketPriceScopes: MarketPriceScopeType[], marketCategories: MarketCategoryType[]) {
    const intl = useIntl()
    const SkuTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.sku' })
    const SkuNameTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.name' })
    const CategoryTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.category' })
    const ScopeTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.addressesAndPrices' })
    const AllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.allProperties' })
    const AndMoreMessage = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.andMore' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const search = getFilteredValue(filters, 'search')
    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    const processedScopes = useMemo(() => {
        const result = {}
        for (const scope of marketPriceScopes) {
            const { marketItemPrice: { marketItem: { id }, price: prices }, property } = scope
            const price = get(prices[0], 'price')

            const { streetPart } = getAddressDetails(property)

            const item = {
                price,
                currency: get(price, 'currencyCode', 'RUB'),
                address: streetPart,
            }

            if (Array.isArray(get(result, [id, price]))) {
                result[id][price].push(item)
                continue
            }

            if (!result[id]) result[id] = {}
            if (!get(result, [id, price])) result[id][price] = {}

            if (!property) {
                result[id].priceForAllProperties = item
                continue
            }
            result[id][price] = [item, item, item]
        }
        return result
    }, [marketPriceScopes])


    const subcategoryCounterGropedByCategoryId = useMemo(() => {
        const result = {}
        for (const category of marketCategories) {
            if (category.parentCategory) {
                isNil(result[category.parentCategory.id]) ? result[category.parentCategory.id] = 1 : result[category.parentCategory.id] += 1
            }
        }
        return result
    }, [marketCategories])

    return useMemo(() => {
        return [
            {
                title: SkuTitle,
                sortOrder: get(sorterMap, 'sku'),
                filteredValue: getFilteredValue(filters, 'sku'),
                key: 'sku',
                dataIndex: 'sku',
                sorter: true,
                width: '8%',
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

                        if (subcategoryCounterGropedByCategoryId[category.parentCategory.id] > 1) return render(`${parentCategoryName}»${categoryName}`)
                        return render(parentCategoryName)
                    }
                    return render(categoryName)
                },
                filterIcon: getFilterIcon,
            },
            {
                title: ScopeTitle,
                key: 'scope',
                width: '25%',
                render: (marketItem) => {
                    const componentsToRender = []
                    const priceForAllProperties = get(processedScopes, [marketItem.id, 'priceForAllProperties'])
                    if (priceForAllProperties) componentsToRender.push(<div key='priceForAllProperties'>
                        {getMoneyRender(intl, get(priceForAllProperties, 'currency', 'RUB'))(get(priceForAllProperties, 'price'))}
                        <Typography.Text type='secondary' style={{ margin: '10px' }}>{AllPropertiesMessage}</Typography.Text>
                    </div>)

                    for (const price in processedScopes[marketItem.id]) {
                        const items = processedScopes[marketItem.id][price]
                        const address = get(items[0], 'address')

                        componentsToRender.push(<div key={address}>
                            {getMoneyRender(intl, get(items[0], 'currency', 'RUB'))(price)}
                            <Typography.Text type='secondary' style={{ margin: '10px' }}>
                                {items.length > 1 ? `${address} ${AndMoreMessage} ${items.length - 1}` : address}
                            </Typography.Text>
                        </div>)
                    }
                    return componentsToRender
                },
                filterIcon: getFilterIcon,
            },
        ]
    }, [sorterMap, filters, intl, search, filterMetas, ScopeTitle, CategoryTitle, SkuNameTitle, SkuTitle])
}

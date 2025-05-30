import {
    MarketPriceScope as MarketPriceScopeType,
    MarketCategory as MarketCategoryType,
    Property,
} from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import isNil from 'lodash/isNil'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getTableCellRenderer,
} from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getAddressDetails, getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getMoneyRender } from '@condo/domains/marketplace/utils/clientSchema/Invoice'
import { PriceMeasuresType } from '@condo/domains/marketplace/utils/clientSchema/MarketItem'

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

export function useMarketplaceServicesTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, marketPriceScopes: MarketPriceScopeType[], marketCategories: MarketCategoryType[], properties: Property[]) {
    const intl = useIntl()
    const SkuTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.sku' })
    const SkuNameTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.name' })
    const CategoryTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.category' })
    const ScopeTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.addressesAndPrices' })
    const AllPropertiesMessage = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.allProperties' })
    const AndMoreMessage = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.andMore' })
    const ContractPriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.contractPrice' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const search = getFilteredValue(filters, 'search')
    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    const processedScopes = useMemo(() => {
        const result = {}
        for (const scope of marketPriceScopes) {
            const id = get(scope, 'marketItemPrice.marketItem.id')
            const prices = get(scope, 'marketItemPrice.price')
            const property = get(scope, 'property')
            const price = get(prices, '0.price')

            const { streetPart } = getAddressDetails(property)

            const item = {
                price,
                isMin: get(prices, '0.isMin'),
                currency: get(prices, '0.currencyCode', defaultCurrencyCode),
                measure: get(prices, '0.measure'),
                address: streetPart,
            }

            if (Array.isArray(get(result, [id, price]))) {
                result[id][price].push(item)
                continue
            }

            if (!result[id]) result[id] = {}
            if (!get(result, [id, price])) result[id][price] = []

            if (!property) {
                result[id].priceForAllProperties = item
                continue
            }
            result[id][price] = [item]
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
                sortOrder: get(sorterMap, 'name'),
                sorter: true,
                key: 'name',
                dataIndex: 'name',
                width: '23%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                render: render,
                filterIcon: getFilterIcon,
            },
            {
                title: CategoryTitle,
                filteredValue: getFilteredValue(filters, 'marketCategory'),
                key: 'marketCategory',
                dataIndex: 'marketCategory',
                width: '23%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'marketCategory'),
                render: (category) => {
                    if (!category) {
                        return '—'
                    }

                    const categoryName = category.name

                    if (category.parentCategory) {
                        const parentCategoryName = category.parentCategory.name

                        if (subcategoryCounterGropedByCategoryId[category.parentCategory.id] > 1) return render(`${parentCategoryName} » ${categoryName}`)
                        return render(parentCategoryName)
                    }
                    return render(categoryName)
                },
                filterIcon: getFilterIcon,
            },
            {
                title: ScopeTitle,
                key: 'property',
                width: '25%',
                filteredValue: getFilteredValue(filters, 'property'),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'property'),
                render: (marketItem) => {
                    const componentsToRender = []
                    const priceForAllProperties = get(processedScopes, [marketItem.id, 'priceForAllProperties'])

                    if (priceForAllProperties) {
                        const currency = get(priceForAllProperties, 'currency', defaultCurrencyCode)
                        const price = get(priceForAllProperties, 'price')
                        const measure: PriceMeasuresType = get(priceForAllProperties, 'measure')
                        const isMin = get(priceForAllProperties, 'isMin')
                        const renderedPrice = isMin && price == 0 ? ContractPriceMessage : getMoneyRender(intl, currency)(price, isMin)

                        const shouldShowMeasure = !!(measure)

                        if (properties.length === 1) {
                            const { streetPart } = getAddressDetails(get(properties, '0'))

                            componentsToRender.push(<div key='priceForAllProperties'>
                                {renderedPrice}
                                <Typography.Text type='secondary' style={{ margin: '10px' }}>
                                    ({streetPart})
                                </Typography.Text>
                            </div>)
                        } else {
                            componentsToRender.push(<div key='priceForAllProperties'>
                                {renderedPrice}{( shouldShowMeasure ? `/${intl.formatMessage( { id: `pages.condo.marketplace.measure.${measure}.short` })}` : '' )}
                                <Typography.Text type='secondary' style={{ margin: '10px' }}>({AllPropertiesMessage})</Typography.Text>
                            </div>)
                        }

                        return componentsToRender
                    }

                    for (const price in processedScopes[marketItem.id]) {
                        const items = processedScopes[marketItem.id][price]
                        const measure: PriceMeasuresType = get(items[0], 'measure')
                        const shouldShowMeasure = !!(measure)
                        const address = get(items[0], 'address')

                        componentsToRender.push(
                            <div key={address}>
                                {
                                    get(items[0], 'isMin') && (get(items[0], 'price') == 0) ?
                                        ContractPriceMessage :
                                        getMoneyRender(intl, get(items[0], 'currency', defaultCurrencyCode))(price, get(items[0], 'isMin'))
                                        + (shouldShowMeasure ? `/${intl.formatMessage( { id: `pages.condo.marketplace.measure.${measure}.short` })}` : '')
                                }
                                <Typography.Text type='secondary' style={{ margin: '10px' }}>
                                ({items.length > 1 ? `${address} ${AndMoreMessage} ${items.length - 1}` : address})
                                </Typography.Text>
                            </div>
                        )
                    }
                    return componentsToRender
                },
                filterIcon: getFilterIcon,
            },
        ]
    }, [SkuTitle, sorterMap, filters, render, filterMetas, SkuNameTitle, CategoryTitle, ScopeTitle, subcategoryCounterGropedByCategoryId, processedScopes, properties, intl, AllPropertiesMessage, ContractPriceMessage, AndMoreMessage])
}

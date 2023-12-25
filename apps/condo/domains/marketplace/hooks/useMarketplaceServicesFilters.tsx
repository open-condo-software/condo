import { MarketItemWhereInput } from '@app/condo/schema'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import uniq from 'lodash/uniq'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getFiltersFromQuery } from '@condo/domains/common/utils/helpers'
import { getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { MarketPriceScope } from '@condo/domains/marketplace/utils/clientSchema'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'


const skuFilter = getStringContainsFilter(['sku'])
const nameFilter = getStringContainsFilter(['name'])
const marketCategoryFilter = (categoryId: string) => {
    if (!categoryId) return
    if (categoryId === 'all') {
        return
    }

    return {
        marketCategory: { id: categoryId },
    }
}

export function useMarketplaceServicesFilters ({ categorySelectOptions }): Array<FiltersMeta<MarketItemWhereInput>>  {
    const intl = useIntl()
    const SkuMessage = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.sku' })
    const NameMessage = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.name' })
    const CategoryMessage = intl.formatMessage({ id: 'pages.condo.marketplace.services.table.category' })
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAddress' })

    const router = useRouter()
    const { organization } = useOrganization()
    const userOrganizationId = get(organization, 'id')

    const filtersFromQuery = useMemo(() => getFiltersFromQuery(router.query), [router.query])
    const searchValueFromQuery = get(filtersFromQuery, 'search')
    const propertyValueFromQuery = get(filtersFromQuery, 'property')

    const propertyWhere = {}
    if (searchValueFromQuery) {
        propertyWhere['address_contains_i'] = searchValueFromQuery
    }
    if (propertyValueFromQuery) {
        propertyWhere['id_in'] = propertyValueFromQuery
    }

    const { objs: marketPriceScopes } = MarketPriceScope.useAllObjects({
        where: {
            property: propertyWhere,
        },
    }, { skip: isEmpty(searchValueFromQuery) && isEmpty(propertyValueFromQuery) })

    const propertyFilter = useCallback(() => {
        if (isEmpty(searchValueFromQuery) && isEmpty(propertyValueFromQuery)) {
            return
        }

        const marketItemIdsFromScopes = uniq(marketPriceScopes.map(scope => get(scope, 'marketItemPrice.marketItem.id')))

        return { id_in: marketItemIdsFromScopes }
    }, [propertyValueFromQuery, marketPriceScopes, searchValueFromQuery])

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [skuFilter, nameFilter, propertyFilter],
                combineType: 'OR',
            },
            {
                keyword: 'sku',
                filters: [skuFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: SkuMessage,
                    },
                },
                combineType: 'OR',
            },
            {
                keyword: 'name',
                filters: [nameFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: NameMessage,
                    },
                },
                combineType: 'OR',
            },
            {
                keyword: 'marketCategory',
                filters: [marketCategoryFilter],
                component: {
                    type: ComponentType.Select,
                    options: categorySelectOptions,
                    props: {
                        placeholder: CategoryMessage,
                    },
                },
                combineType: 'OR',
            },
            {
                keyword: 'property',
                filters: [propertyFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchOrganizationProperty(userOrganizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterAddressMessage,
                        infinityScroll: true,
                    },
                },
                combineType: 'OR',
            },
        ]
    }, [propertyFilter, SkuMessage, NameMessage, categorySelectOptions, CategoryMessage, userOrganizationId, EnterAddressMessage])
}
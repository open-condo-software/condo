import { BillingReceiptWhereInput } from '@app/condo/schema'
import isEmpty from 'lodash/isEmpty'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { BillingProperty as BillingPropertyGQL } from '@condo/domains/billing/gql'
import { BillingCategory } from '@condo/domains/billing/utils/clientSchema'
import { ISearchInputProps } from '@condo/domains/common/components/GraphQlSearchInput'
import { ComponentType, convertToOptions, FilterComponentSize, TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getAddressDetails, ObjectWithAddressInfo } from '@condo/domains/common/utils/helpers'
import { categoryToSearchQuery, getFilter, getStringContainsFilter, QueryArgType, WhereType } from '@condo/domains/common/utils/tables.utils'

const addressFilter = (search: QueryArgType) => {
    if (!search) return

    const addressKeys = (Array.isArray(search) ? search : [search])
        .map((value) => String(value).trim())
        .filter(Boolean)

    if (addressKeys.length === 0) return
    if (addressKeys.length === 1) return { property: { addressKey: addressKeys[0] } }

    return {
        OR: addressKeys.map((addressKey) => ({ property: { addressKey } })),
    }
}
const addressStringContainsFilter = getStringContainsFilter(['property', 'address'])
const unitNameFilter = getStringContainsFilter(['account', 'unitName'])
const accountFilter = getStringContainsFilter(['account', 'number'])
const fullNameFilter = getStringContainsFilter(['account', 'fullName'])
const categoryFilter = getFilter(['category', 'id'], 'array', 'string', 'in')
const periodFilter = (period: string) => ({ period })

const formatAddressOptionText = (property: ObjectWithAddressInfo): string => {
    const { streetPart, cityPart } = getAddressDetails(property)
    if (streetPart && cityPart) return `${streetPart}, ${cityPart}`
    return streetPart || property?.address || ''
}

const searchBillingPropertyByContextIds = (contextIds: string[]): ISearchInputProps['search'] => {
    return async function (client, searchText, query = {}, first = 10, skip = 0) {
        if (!contextIds?.length) return []

        const addressSearchFilter = isEmpty(searchText) ? {} : { address_contains_i: searchText }
        const where = {
            ...addressSearchFilter,
            ...query,
            context: { id_in: contextIds },
        }
        const sortBy = ['address_ASC']

        const { data = {}, error } = await client.query({
            query: BillingPropertyGQL.GET_ALL_OBJS_QUERY,
            variables: { where, sortBy, first, skip },
            fetchPolicy: 'network-only',
        })

        if (error) console.warn(error)

        const uniqueByAddressKey = new Map<string, { text: string, value: string }>()
        for (const property of (data?.objs || []).filter(Boolean)) {
            const addressKey = property?.addressKey
            if (!addressKey || uniqueByAddressKey.has(addressKey)) continue

            uniqueByAddressKey.set(addressKey, {
                text: formatAddressOptionText({ address: property.address, addressMeta: property.addressMeta }),
                value: addressKey,
            })
        }

        return Array.from(uniqueByAddressKey.values())
    }
}

const getAddressKeyInitialValueQuery = (initialValue: string | string[]): WhereType => {
    const addressKeys = (Array.isArray(initialValue) ? initialValue : [initialValue]).filter(Boolean)
    if (addressKeys.length === 0) return {}
    return { addressKey_in: addressKeys }
}

export function useReceiptTableFilters (defaultPeriod: string | null, search: string, contextIds: string[] = []): Array<TableFiltersMeta<BillingReceiptWhereInput>>  {
    const intl = useIntl()
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAddress' })
    const EnterUnitNameMessage = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })
    const EnterAccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAccountNumber' })
    const EnterHolderMessage = intl.formatMessage({ id: 'field.Holder' })
    const StatusMessage =  intl.formatMessage({ id: 'Status' })
    const categorySearchFilter = useMemo(
        () => categoryToSearchQuery(search, intl.messages),
        [search, intl.messages]
    )
    const billingPropertySearch = useMemo(() => searchBillingPropertyByContextIds(contextIds), [contextIds])
    const { objs: categories } = BillingCategory.useObjects({})
    const categoryOptionsKey = useMemo(
        () => categories.map(({ id, name }) => `${id}:${name}`).sort().join('|'),
        [categories]
    )
    // NOTE: Keep options reference stable while data content is unchanged, to avoid filter component remounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const categoryOptions = useMemo(() => convertToOptions(categories, 'name', 'id'), [categoryOptionsKey])
    return useMemo(() => {
        return [
            { keyword: 'period', filters: [periodFilter], defaultValue: defaultPeriod || undefined },
            { keyword: 'search', filters: [addressStringContainsFilter, unitNameFilter, accountFilter, fullNameFilter, categorySearchFilter], combineType: 'OR' },
            {
                keyword: 'address',
                filters: [addressFilter],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: billingPropertySearch,
                        getInitialValueQuery: getAddressKeyInitialValueQuery,
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterAddressMessage,
                        infinityScroll: true,
                    },
                    modalFilterComponentWrapper: {
                        label: EnterAddressMessage,
                        size: FilterComponentSize.Large,
                    },
                    columnFilterComponentWrapper: {
                        width: '400px',
                    },
                },
            },
            {
                keyword: 'unitName',
                filters: [unitNameFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: EnterUnitNameMessage,
                    },
                },
            },
            {
                keyword: 'account',
                filters: [accountFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: EnterAccountNumberMessage,
                    },
                },
            },
            {
                keyword: 'fullName',
                filters: [fullNameFilter],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: EnterHolderMessage,
                    },
                },
            },
            {
                keyword: 'category',
                filters: [categoryFilter],
                component: {
                    type: ComponentType.Select,
                    options: categoryOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: StatusMessage,
                        size: FilterComponentSize.Small,
                    },
                },
            },
        ]
    }, [
        EnterAccountNumberMessage,
        EnterAddressMessage,
        EnterHolderMessage,
        EnterUnitNameMessage,
        SelectMessage,
        StatusMessage,
        billingPropertySearch,
        categoryOptions,
        defaultPeriod,
        categorySearchFilter,
    ])
  
}

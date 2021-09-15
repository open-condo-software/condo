import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useMemo } from 'react'
import get from 'lodash/get'
import {
    getDateFilterDropdown,
    getFilterIcon, getOptionFilterDropdown,
    getTextFilterDropdown,
} from '@condo/domains/common/components/Table/Filters'
import { LOCALES } from '@condo/domains/common/constants/locale'
import dayjs from 'dayjs'
import { getAddressRender, getMoneyRender, getTextRender } from '@condo/domains/common/components/Table/Renders'

export const usePaymentsTableColumns = (currencyMark: string, currencyDivider: string) => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const TypeTitle = intl.formatMessage({ id: 'field.Type' })
    const TransactionTitle = intl.formatMessage({ id: 'field.Transaction' })
    const AmountTitle = intl.formatMessage({ id: 'field.PaymentAmount' })
    const UnitNamePrefix = intl.formatMessage({ id: 'field.ShortFlatNumber' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        // TODO (savelevMatthew): Check filters / sorters / dataIndexes
        const dateDataIndex = 'date'
        const accountNumberDataIndex = ['account', 'number']
        const propertyDataIndex = ['property', 'address']
        const typeDataIndex = 'type'
        const transactionDataIndex = ['transaction']
        const toPayDataIndex = 'toPay'

        const querySearch = get(filters, 'search')
        const searchValue = Array.isArray(querySearch) ? undefined : querySearch

        return [
            {
                title: DateTitle,
                key: 'date',
                dataIndex: dateDataIndex,
                width: '13%',
                sorter: false,
                // sortOrder: get(sorterMap, 'date'),
                filteredValue: get(filters, 'date'),
                filterIcon: getFilterIcon,
                filterDropdown: getDateFilterDropdown(),
                render: (createdAt) => {
                    const locale = get(LOCALES, intl.locale)
                    const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
                    return date.format('D MMM YYYY')
                },
            },
            {
                title: AccountTitle,
                key: 'account',
                dataIndex: accountNumberDataIndex,
                width: '17%',
                sorter: false,
                filteredValue: get(filters, 'account'),
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(AccountTitle),
                render: getTextRender(searchValue),
            },
            {
                title: AddressTitle,
                key: 'address',
                dataIndex: propertyDataIndex,
                width: '23%',
                sorter: false,
                filteredValue: get(filters, 'address'),
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(AddressTitle),
                render: getAddressRender(UnitNamePrefix, searchValue),
            },
            {
                title: TypeTitle,
                key: 'type',
                dataIndex: typeDataIndex,
                width: '17%',
                sorter: false,
                filteredValue: get(filters, 'type'),
                filterIcon: getFilterIcon,
                // TODO (savelevMatthew): Add options from const
                filterDropdown: getOptionFilterDropdown([], false),
                render: getTextRender(searchValue),
            },
            {
                title: TransactionTitle,
                key: 'transaction',
                dataIndex: transactionDataIndex,
                width: '17%',
                ellipsis: true,
                sorter: false,
                filteredValue: get(filters, 'transaction'),
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(TransactionTitle),
                render: getTextRender(searchValue),
            },
            {
                title: AmountTitle,
                key: 'toPay',
                dataIndex: toPayDataIndex,
                width: '13%',
                sorter: false,
                filteredValue: get(filters, 'toPay'),
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(AmountTitle),
                render: getMoneyRender(searchValue, currencyMark, currencyDivider),
            },
        ]
    }, [
        UnitNamePrefix,
        DateTitle,
        AccountTitle,
        AddressTitle,
        TypeTitle,
        AmountTitle,
        TransactionTitle,
        filters,
        intl.locale,
        currencyDivider,
        currencyMark,
    ])
}
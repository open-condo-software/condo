import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getFilterIcon, getTextFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getAddressRender, getMoneyRender, getTextRender } from '@condo/domains/common/components/Table/Renders'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'

export const useReceiptTableColumns = (detailed: boolean, currencySign: string, separator: string) => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const DebtTitle = intl.formatMessage({ id: 'DebtOverpayment' })
    const ToPayTitle = intl.formatMessage({ id: 'field.TotalPayment' })
    const PenaltyTitle = intl.formatMessage({ id: 'PaymentPenalty' })
    const ChargeTitle = intl.formatMessage({ id: 'Charged' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.FlatNumber' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const renderAddress = (record) => {
            const property = get(record, ['property', 'address'])
            const unitName = get(record, ['account', 'unitName'])
            const unitPrefix = unitName ? `${ShortFlatNumber} ${unitName}` : ''

            return getAddressRender(search, unitPrefix)(property)
        }

        const columns = {
            address: {
                title: AddressTitle,
                key: 'address',
                dataIndex: [],
                sorter: false,
                filteredValue: get(filters, 'address'),
                width: detailed ? '30%' : '50%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(AddressTitle),
                render: renderAddress,
            },
            account: {
                title: AccountTitle,
                key: 'account',
                dataIndex: ['account', 'number'],
                sorter: false,
                filteredValue: get(filters, 'account'),
                width: detailed ? '28%' : '30%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(AccountTitle),
                render: getTextRender(search),
            },
            balance: {
                title: DebtTitle,
                key: 'balance',
                dataIndex: ['toPayDetails', 'balance'],
                sorter: false,
                width: '13%',
                align: 'right',
                render: getMoneyRender(undefined, currencySign, separator),
            },
            penalty: {
                title: PenaltyTitle,
                key: 'penalty',
                dataIndex: ['toPayDetails', 'penalty'],
                sorter: false,
                width: '13%',
                align: 'right',
                render: getMoneyRender(undefined, currencySign, separator),
            },
            charge: {
                title: ChargeTitle,
                key: 'charge',
                dataIndex: ['toPayDetails', 'charge'],
                sorter: false,
                width: '13%',
                align: 'right',
                render: getMoneyRender(undefined, currencySign, separator),
            },
            toPay: {
                title: ToPayTitle,
                key: 'toPay',
                dataIndex: ['toPay'],
                sorter: true,
                sortOrder: get(sorterMap, 'toPay'),
                filteredValue: get(filters, 'toPay'),
                width: detailed ? '13%' : '20%',
                align: 'right',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(ToPayTitle),
                render: getMoneyRender(search, currencySign, separator),
            },
        }

        return detailed
            ? [columns.address, columns.account, columns.balance, columns.penalty, columns.charge, columns.toPay]
            : [columns.address, columns.account, columns.toPay]
    }, [
        AddressTitle,
        AccountTitle,
        ToPayTitle,
        DebtTitle,
        PenaltyTitle,
        ChargeTitle,
        filters,
        sorterMap,
        detailed,
        currencySign,
        separator,
    ])
}
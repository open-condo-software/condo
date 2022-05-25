import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getFilterIcon, getTextFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getMoneyRender, getTextRender } from '@condo/domains/common/components/Table/Renders'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'

export const useReceiptTableColumns = (detailed: boolean, currencyCode: string) => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const UnitNameTitle = intl.formatMessage({ id: 'field.UnitName' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const DebtTitle = intl.formatMessage({ id: 'DebtOverpayment' })
    const ToPayTitle = intl.formatMessage({ id: 'field.TotalPayment' })
    const PenaltyTitle = intl.formatMessage({ id: 'PaymentPenalty' })
    const ChargeTitle = intl.formatMessage({ id: 'Charged' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.ShortFlatNumber' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const columns = {
            address: {
                title: AddressTitle,
                key: 'address',
                dataIndex: ['property', 'address'],
                sorter: false,
                filteredValue: get(filters, 'address'),
                width: detailed ? '30%' : '50%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(AddressTitle),
                render: getTextRender(search),
            },
            unitName: {
                title: UnitNameTitle,
                key: 'unitName',
                dataIndex: ['account', 'unitName'],
                sorter: false,
                filteredValue: get(filters, 'unitName'),
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(UnitNameTitle),
                width: '15%',
                render: getTextRender(search),
            },
            account: {
                title: AccountTitle,
                key: 'account',
                dataIndex: ['account', 'number'],
                sorter: false,
                filteredValue: get(filters, 'account'),
                width: detailed ? '25%' : '30%',
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
                render: getMoneyRender(intl, currencyCode),
            },
            penalty: {
                title: PenaltyTitle,
                key: 'penalty',
                dataIndex: ['toPayDetails', 'penalty'],
                sorter: false,
                width: '13%',
                align: 'right',
                render: getMoneyRender(intl, currencyCode),
            },
            charge: {
                title: ChargeTitle,
                key: 'charge',
                dataIndex: ['toPayDetails', 'charge'],
                sorter: false,
                width: '13%',
                align: 'right',
                render: getMoneyRender(intl, currencyCode),
            },
            toPay: {
                title: ToPayTitle,
                key: 'toPay',
                dataIndex: ['toPay'],
                sorter: true,
                sortOrder: get(sorterMap, 'toPay'),
                width: detailed ? '13%' : '20%',
                align: 'right',
                render: getMoneyRender(intl, currencyCode),
            },
        }

        return detailed
            ? [columns.address, columns.unitName, columns.account, columns.balance, columns.penalty, columns.charge, columns.toPay]
            : [columns.address, columns.unitName, columns.account, columns.toPay]
    }, [
        AddressTitle,
        AccountTitle,
        ToPayTitle,
        DebtTitle,
        PenaltyTitle,
        ChargeTitle,
        filters,
        sorterMap,
        ShortFlatNumber,
        detailed,
        currencyCode,
    ])
}

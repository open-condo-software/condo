import { get } from 'lodash'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    getColumnTooltip,
    getDateRender,
    getMoneyRender,
    getStatusRender,
    getTextRender,
} from '@condo/domains/common/components/Table/Renders'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'

export function usePaymentsTableColumns (currencyCode: string, openStatusDescModal): Record<string, unknown>[] {
    const intl = useIntl()
    const router = useRouter()

    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const UnitNameTitle = intl.formatMessage({ id: 'field.FlatNumber' })
    const TypeTitle = intl.formatMessage({ id: 'PaymentType' })
    const TransactionTitle = intl.formatMessage({ id: 'Transaction' })
    const PaymentAmountTitle = intl.formatMessage({ id: 'PaymentAmount' })
    const PaymentOrderColumnTitle = intl.formatMessage({ id: 'PaymentOrderShort' })
    const PaymentOrderTooltipTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })

    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const stringSearch = getTextRender(String(search))

        const columns = {
            date: {
                title: DateTitle,
                key: 'advancedAt',
                dataIndex: ['advancedAt'],
                sorter: true,
                width: '112px',
                render: getDateRender(intl, String(search)),
            },
            account: {
                title: AccountTitle,
                key: 'accountNumber',
                dataIndex: 'accountNumber',
                width: '120px',
                render: stringSearch,
            },
            address: {
                title: AddressTitle,
                key: 'address',
                sorter: true,
                render: (obj) => stringSearch(get(
                    obj,
                    ['receipt', 'property', 'address'],
                    get(obj, ['frozenReceipt', 'data', 'property', 'address'], null),
                )),
            },
            unitName: {
                title: UnitNameTitle,
                key: 'unitName',
                width: '128px',
                render: (obj) => stringSearch(get(
                    obj,
                    ['receipt', 'account', 'unitName'],
                    get(obj, ['frozenReceipt', 'data', 'account', 'unitName'], null),
                )),
            },
            type: {
                title: TypeTitle,
                key: 'type',
                dataIndex: ['context', 'integration', 'name'],
                render: stringSearch,
            },
            transaction: {
                title: TransactionTitle,
                key: 'transaction',
                dataIndex: ['multiPayment', 'transactionId'],
                render: stringSearch,
            },
            status: {
                title: StatusTitle,
                key: 'status',
                dataIndex: 'status',
                render: getStatusRender(intl, openStatusDescModal, search),
            },
            order: {
                title: getColumnTooltip(PaymentOrderColumnTitle, PaymentOrderTooltipTitle),
                key: 'order',
                dataIndex: 'order',
                render: stringSearch,
            },
            amount: {
                title: PaymentAmountTitle,
                key: 'amount',
                dataIndex: 'amount',
                render: getMoneyRender(intl, currencyCode),
                width: '144px',
                sorter: true,
            },
        }

        return Object.values(columns)
    }, [
        filters, DateTitle, intl,
        AccountTitle, AddressTitle,
        UnitNameTitle, TypeTitle,
        TransactionTitle, StatusTitle,
        openStatusDescModal,
        PaymentOrderColumnTitle,
        PaymentOrderTooltipTitle,
        PaymentAmountTitle, currencyCode,
    ])
}

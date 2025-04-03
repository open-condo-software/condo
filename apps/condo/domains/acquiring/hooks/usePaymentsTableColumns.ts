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
    const TransferDateTitle = intl.formatMessage({ id: 'TransferDate' })
    const DepositedDateTitle = intl.formatMessage({ id: 'DepositedDate' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const TypeTitle = intl.formatMessage({ id: 'PaymentType' })
    const TransactionTitle = intl.formatMessage({ id: 'Transaction' })
    const PaymentAmountTitle = intl.formatMessage({ id: 'PaymentAmount' })
    const PaymentOrderColumnTitle = intl.formatMessage({ id: 'PaymentOrderShort' })
    const PaymentOrderTooltipTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })

    const { filters } = parseQuery(router.query)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const stringSearch = getTextRender(String(search))

        const columns = {
            depositedDate: {
                title: DepositedDateTitle,
                key: 'depositedDate',
                dataIndex: ['depositedDate'],
                sorter: true,
                width: '112px',
                render: getDateRender(intl, String(search)),
            },
            transferDate: {
                title: TransferDateTitle,
                key: 'transferDate',
                dataIndex: ['transferDate'],
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
                key: 'rawAddress',
                sorter: true,
                render: (obj) => stringSearch(get(
                    obj,
                    ['rawAddress'],
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
        filters, DepositedDateTitle, TransferDateTitle,
        intl, AccountTitle, AddressTitle,
        TypeTitle,
        TransactionTitle, StatusTitle,
        openStatusDescModal,
        PaymentOrderColumnTitle,
        PaymentOrderTooltipTitle,
        PaymentAmountTitle, currencyCode,
    ])
}

import {
    getDateRender,
    getMoneyRender,
    getStatusRender,
    getTextRender,
} from '@condo/domains/common/components/Table/Renders'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useIntl } from '@core/next/intl'
import { get } from 'lodash'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

export function usePaymentsTableColumns (currencyCode: string, openStatusDescModal): Record<string, unknown>[] {
    const intl = useIntl()
    const router = useRouter()

    const addressTitle = intl.formatMessage({ id: 'field.Address' })
    const dateTitle = intl.formatMessage({ id: 'Date' })
    const accountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const unitNameTitle = intl.formatMessage({ id: 'field.FlatNumber' })
    const typeTitle = intl.formatMessage({ id: 'PaymentType' })
    const transactionTitle = intl.formatMessage({ id: 'Transaction' })
    const paymentAmountTitle = intl.formatMessage({ id: 'PaymentAmount' })
    const statusTitle = intl.formatMessage({ id: 'Status' })

    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const stringSearch = getTextRender(String(search))

        const columns = {
            date: {
                title: dateTitle,
                key: 'advancedAt',
                dataIndex: ['advancedAt'],
                sorter: true,
                width: '112px',
                render: getDateRender(intl, String(search)),
            },
            account: {
                title: accountTitle,
                key: 'accountNumber',
                dataIndex: 'accountNumber',
                width: '120px',
                render: stringSearch,
            },
            address: {
                title: addressTitle,
                key: 'address',
                sorter: true,
                render: (obj) => stringSearch(get(
                    obj,
                    ['receipt', 'property', 'address'],
                    get(obj, ['frozenReceipt', 'data', 'property', 'address'], null),
                )),
            },
            unitName: {
                title: unitNameTitle,
                key: 'unitName',
                width: '128px',
                render: (obj) => stringSearch(get(
                    obj,
                    ['receipt', 'account', 'unitName'],
                    get(obj, ['frozenReceipt', 'data', 'account', 'unitName'], null),
                )),
            },
            type: {
                title: typeTitle,
                key: 'type',
                dataIndex: ['context', 'integration', 'name'],
                render: stringSearch,
            },
            transaction: {
                title: transactionTitle,
                key: 'transaction',
                dataIndex: ['multiPayment', 'transactionId'],
                render: stringSearch,
            },
            status: {
                title: statusTitle,
                key: 'status',
                dataIndex: 'status',
                render: getStatusRender(intl, openStatusDescModal, search),
            },
            amount: {
                title: paymentAmountTitle,
                key: 'amount',
                dataIndex: 'amount',
                render: getMoneyRender(intl, currencyCode),
                width: '144px',
                sorter: true,
            },
        }

        return Object.values(columns)
    }, [
        filters,
        sorterMap,
        currencyCode,
    ])
}

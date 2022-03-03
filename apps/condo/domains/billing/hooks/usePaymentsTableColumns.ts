import { getDateRender, getMoneyRender, getTextRender } from '@condo/domains/common/components/Table/Renders'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { useIntl } from '@core/next/intl'
import { get } from 'lodash'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

export function usePaymentsTableColumns<T> (currencyCode: string) {
    const intl = useIntl()
    const router = useRouter()

    const addressTitle = intl.formatMessage({ id: 'field.Address' })
    const dateTitle = intl.formatMessage({ id: 'Date' })
    const accountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const unitNameTitle = intl.formatMessage({ id: 'field.FlatNumber' })
    const typeTitle = intl.formatMessage({ id: 'PaymentType' })
    const transactionTitle = intl.formatMessage({ id: 'Transaction' })
    const paymentAmountTitle = intl.formatMessage({ id: 'PaymentAmount' })

    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

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
                render: getTextRender(String(search)),
            },
            address: {
                title: addressTitle,
                key: 'address',
                dataIndex: ['frozenReceipt', 'data', 'property', 'address'],
                sorter: true,
                render: getTextRender(String(search)),
            },
            unitName: {
                title: unitNameTitle,
                key: 'unitName',
                dataIndex: ['frozenReceipt', 'data', 'account', 'unitName'],
                width: '128px',
                render: getTextRender(String(search)),
            },
            type: {
                title: typeTitle,
                key: 'type',
                dataIndex: ['context', 'integration', 'name'],
                render: getTextRender(String(search)),
            },
            transaction: {
                title: transactionTitle,
                key: 'transaction',
                dataIndex: ['multiPayment', 'transactionId'],
                render: getTextRender(String(search)),
            },
            amount: {
                title: paymentAmountTitle,
                key: 'amount',
                dataIndex: 'amount',
                render: getMoneyRender(String(search), intl, currencyCode),
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
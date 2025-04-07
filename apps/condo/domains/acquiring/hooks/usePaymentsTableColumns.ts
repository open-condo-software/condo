import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    getDateRender,
    getMoneyRender,
    getStatusRender,
    getTextRender,
    getColumnTooltip,
} from '@condo/domains/common/components/Table/Renders'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

export function usePaymentsTableColumns (currencyCode: string, openStatusDescModal): Record<string, unknown>[] {
    const intl = useIntl()
    const router = useRouter()

    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const TransferDateTitle = intl.formatMessage({ id: 'TransferDate' })
    const DepositedDateTitle = intl.formatMessage({ id: 'DepositedDate' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const PaymentAmountTitle = intl.formatMessage({ id: 'PaymentAmount' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })
    const PaymentOrderColumnTitle = intl.formatMessage({ id: 'PaymentOrderShort' })
    const PaymentOrderTooltipTitle = intl.formatMessage({ id: 'PaymentOrder' })

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
                width: '11em',
                render: getDateRender(intl, String(search)),
            },
            transferDate: {
                title: TransferDateTitle,
                key: 'transferDate',
                dataIndex: ['transferDate'],
                sorter: true,
                width: '11em',
                render: getDateRender(intl, String(search)),
            },
            account: {
                title: AccountTitle,
                key: 'accountNumber',
                dataIndex: 'accountNumber',
                width: '10em',
                render: stringSearch,
            },
            address: {
                title: AddressTitle,
                key: 'rawAddress',
                dataIndex: 'rawAddress',
                width: '25em',
                sorter: true,
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
                width: '14em',
                sorter: true,
            },
        }

        return Object.values(columns)
    }, [filters, DepositedDateTitle, intl, TransferDateTitle, AccountTitle, AddressTitle, StatusTitle, openStatusDescModal, PaymentAmountTitle, currencyCode])
}

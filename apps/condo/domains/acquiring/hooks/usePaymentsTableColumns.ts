import { GetB2BAppContextWithPosIntegrationConfigQuery } from '@app/condo/gql'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getPosReceiptUrlRender } from '@condo/domains/acquiring/components/payments/getPosReceiptUrlRender'
import {
    getDateRender,
    getMoneyRender,
    getStatusRender,
    getTextRender,
    getColumnTooltip,
} from '@condo/domains/common/components/Table/Renders'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

import { LastTestingPosReceiptData } from './usePosIntegrationLastTestingPosReceipt'


type PaymentsTableColumnsOptions = {
    lastTestingPosReceipt?: LastTestingPosReceiptData
    posIntegrationContext?: GetB2BAppContextWithPosIntegrationConfigQuery['contexts'][number]
}

export function usePaymentsTableColumns (currencyCode: string, openStatusDescModal, options: PaymentsTableColumnsOptions = {}): Record<string, unknown>[] {
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
    const PosReceiptColumnTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptColumn' })
    const PosReceiptLinkTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptLink' })
    const PosReceiptVerifyTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptVerifyTitle' })
    const PosReceiptVerifyDescription = intl.formatMessage({ id: 'pages.condo.payments.posReceiptVerifyDescription' })

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
                width: '10em',
                render: getStatusRender(intl, openStatusDescModal, search),
            },
            order: {
                title: getColumnTooltip(PaymentOrderColumnTitle, PaymentOrderTooltipTitle),
                key: 'order',
                dataIndex: 'order',
                width: '10em',
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
            posReceiptUrl: options.posIntegrationContext ? {
                title: PosReceiptColumnTitle,
                key: 'posReceiptUrl',
                dataIndex: 'posReceiptUrl',
                render: getPosReceiptUrlRender({
                    linkText: PosReceiptLinkTitle,
                    verifyTitle: PosReceiptVerifyTitle,
                    verifyDescription: PosReceiptVerifyDescription,
                    lastTestingPosReceipt: options.lastTestingPosReceipt,
                }),
                width: '10em',
            } : undefined,
        }

        return Object.values(columns).filter(Boolean)
    }, [filters, DepositedDateTitle, intl, TransferDateTitle, AccountTitle, AddressTitle, StatusTitle, openStatusDescModal, PaymentOrderColumnTitle, PaymentOrderTooltipTitle, PaymentAmountTitle, currencyCode, options.posIntegrationContext, options.lastTestingPosReceipt, PosReceiptColumnTitle, PosReceiptLinkTitle, PosReceiptVerifyTitle, PosReceiptVerifyDescription])
}

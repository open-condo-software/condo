import { GetB2BAppContextWithPosIntegrationConfigQuery } from '@app/condo/gql'
import { Payment } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { TableColumn } from '@open-condo/ui'

import { getPosReceiptUrlRender } from '@condo/domains/acquiring/components/payments/getPosReceiptUrlRender'
import {
    getColumnTooltip,
    getDateRender,
    getMoneyRender,
    getStatusRender,
    getTextRender,
} from '@condo/domains/common/components/Table/Renders'

import { LastTestingPosReceiptData } from './usePosIntegrationLastTestingPosReceipt'

import type { AcquiringIntegrationContext } from '@app/condo/schema'


type PaymentsTableColumnsOptions = {
    acquiringContexts?: AcquiringIntegrationContext[]
    lastTestingPosReceipt?: LastTestingPosReceiptData
    posIntegrationContext?: GetB2BAppContextWithPosIntegrationConfigQuery['contexts'][number]
    search?: string
}

type PaymentColumn = TableColumn<Payment>
type PaymentDataKey = Extract<PaymentColumn, { dataKey: unknown }>['dataKey']

const paymentDataKey = <TKey extends PaymentDataKey>(value: TKey): TKey => value

export function usePaymentsTableColumns (
    currencyCode: string,
    openStatusDescModal,
    options: PaymentsTableColumnsOptions = {}
): PaymentColumn[] {
    const intl = useIntl()

    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const PaymentAmountTitle = intl.formatMessage({ id: 'PaymentAmount' })
    const PaymentSourceTitle = intl.formatMessage({ id: 'field.Source' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })
    const PaymentOrderColumnTitle = intl.formatMessage({ id: 'PaymentOrderShort' })
    const PaymentOrderTooltipTitle = intl.formatMessage({ id: 'PaymentOrder' })
    const PosReceiptColumnTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptColumn' })
    const PosReceiptLinkTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptLink' })
    const PosReceiptVerifyTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptVerifyTitle' })
    const PosReceiptVerifyDescription = intl.formatMessage({ id: 'pages.condo.payments.posReceiptVerifyDescription' })

    return useMemo(() => {
        const stringRender = getTextRender(options.search)
        const hasSourceColumn = Boolean(options.acquiringContexts?.length > 1)
        const hasPosReceiptUrlColumn = Boolean(options.posIntegrationContext)

        const columns: Record<string, PaymentColumn | null> = {
            depositedDate: {
                header: DateTitle,
                id: 'depositedDate',
                dataKey: paymentDataKey('depositedDate'),
                enableSorting: true,
                initialSize: '11%',
                render: getDateRender(intl, options.search),
            },
            account: {
                header: AccountTitle,
                id: 'accountNumber',
                dataKey: paymentDataKey('accountNumber'),
                enableSorting: false,
                initialSize: '8%',
                render: stringRender,
            },
            address: {
                header: AddressTitle,
                id: 'rawAddress',
                dataKey: paymentDataKey('rawAddress'),
                enableSorting: true,
                initialSize: '20%',
                render: stringRender,
            },
            source: hasSourceColumn ? {
                header: PaymentSourceTitle,
                id: 'integration',
                dataKey: paymentDataKey('context.integration.name'),
                enableSorting: false,
                initialSize: '7%',
            } : null,
            order: {
                header: () => getColumnTooltip(PaymentOrderColumnTitle, PaymentOrderTooltipTitle),
                id: 'order',
                dataKey: paymentDataKey('order'),
                enableSorting: false,
                initialSize: '8%',
                render: stringRender,
            },
            status: {
                header: StatusTitle,
                id: 'status',
                dataKey: paymentDataKey('status'),
                enableSorting: false,
                initialSize: '8%',
                render: getStatusRender(intl, openStatusDescModal, options.search),
            },
            amount: {
                header: PaymentAmountTitle,
                id: 'amount',
                dataKey: paymentDataKey('amount'),
                enableSorting: true,
                initialSize: '10%',
                render: getMoneyRender(intl, currencyCode),
            },
            posReceiptUrl: hasPosReceiptUrlColumn ? {
                header: PosReceiptColumnTitle,
                id: 'posReceiptUrl',
                dataKey: paymentDataKey('posReceiptUrl'),
                enableSorting: false,
                render: getPosReceiptUrlRender({
                    linkText: PosReceiptLinkTitle,
                    verifyTitle: PosReceiptVerifyTitle,
                    verifyDescription: PosReceiptVerifyDescription,
                    lastTestingPosReceipt: options.lastTestingPosReceipt,
                }),
                initialSize: '8%',
            } : null,
        }

        return Object.values(columns).filter((column): column is PaymentColumn => Boolean(column))
    }, [
        AccountTitle,
        AddressTitle,
        DateTitle,
        PaymentAmountTitle,
        PaymentOrderColumnTitle,
        PaymentOrderTooltipTitle,
        PaymentSourceTitle,
        PosReceiptColumnTitle,
        PosReceiptLinkTitle,
        PosReceiptVerifyDescription,
        PosReceiptVerifyTitle,
        StatusTitle,
        currencyCode,
        intl,
        openStatusDescModal,
        options.acquiringContexts,
        options.lastTestingPosReceipt,
        options.posIntegrationContext,
        options.search,
    ])
}

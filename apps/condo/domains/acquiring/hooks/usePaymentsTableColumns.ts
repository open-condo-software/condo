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

import type { AcquiringIntegrationContext } from '@app/condo/schema'


type PaymentsTableColumnsOptions = {
    acquiringContexts?: AcquiringIntegrationContext[]
    lastTestingPosReceipt?: LastTestingPosReceiptData
    posIntegrationContext?: GetB2BAppContextWithPosIntegrationConfigQuery['contexts'][number]
}

export function usePaymentsTableColumns (currencyCode: string, openStatusDescModal, options: PaymentsTableColumnsOptions = {}): Record<string, unknown>[] {
    const intl = useIntl()
    const router = useRouter()

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

    const { filters } = parseQuery(router.query)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const stringSearch = getTextRender(String(search))
        const hasSourceColumn = Boolean(options.acquiringContexts?.length > 1)
        const hasPosReceiptUrlColumn = Boolean(options.posIntegrationContext)

        const columns = {
            depositedDate: {
                title: DateTitle,
                key: 'depositedDate',
                dataIndex: ['depositedDate'],
                sorter: true,
                width: '11%',
                render: getDateRender(intl, String(search)),
            },
            account: {
                title: AccountTitle,
                key: 'accountNumber',
                dataIndex: 'accountNumber',
                width: '8%',
                render: stringSearch,
            },
            address: {
                title: AddressTitle,
                key: 'rawAddress',
                dataIndex: 'rawAddress',
                width: '20%',
                sorter: true,
                render: stringSearch,
            },
            status: {
                title: StatusTitle,
                key: 'status',
                dataIndex: 'status',
                width: '8%',
                render: getStatusRender(intl, openStatusDescModal, search),
            },
            order: {
                title: getColumnTooltip(PaymentOrderColumnTitle, PaymentOrderTooltipTitle),
                key: 'order',
                dataIndex: 'order',
                width: '8%',
                render: stringSearch,
            },
            amount: {
                title: PaymentAmountTitle,
                key: 'amount',
                dataIndex: 'amount',
                render: getMoneyRender(intl, currencyCode),
                width: '10%',
                sorter: true,
            },
            source: hasSourceColumn ? {
                title: PaymentSourceTitle,
                key: 'integration',
                dataIndex: ['context', 'integration', 'name'],
                width: '7%',
            } : null,
            posReceiptUrl: hasPosReceiptUrlColumn ? {
                title: PosReceiptColumnTitle,
                key: 'posReceiptUrl',
                dataIndex: 'posReceiptUrl',
                render: getPosReceiptUrlRender({
                    linkText: PosReceiptLinkTitle,
                    verifyTitle: PosReceiptVerifyTitle,
                    verifyDescription: PosReceiptVerifyDescription,
                    lastTestingPosReceipt: options.lastTestingPosReceipt,
                }),
                width: '8%',
            } : undefined,
        }

        return Object.values(columns).filter(Boolean)
    }, [filters, DateTitle, intl, AccountTitle, AddressTitle, StatusTitle, openStatusDescModal, PaymentOrderColumnTitle, PaymentOrderTooltipTitle, PaymentAmountTitle, currencyCode, options.acquiringContexts, options.posIntegrationContext, options.lastTestingPosReceipt, PaymentSourceTitle, PosReceiptColumnTitle, PosReceiptLinkTitle, PosReceiptVerifyTitle, PosReceiptVerifyDescription])
}

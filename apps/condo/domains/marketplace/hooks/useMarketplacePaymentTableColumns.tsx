import { GetB2BAppContextWithPosIntegrationConfigQuery } from '@app/condo/gql'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getPosReceiptUrlRender } from '@condo/domains/acquiring/components/payments/getPosReceiptUrlRender'
import { LastTestingPosReceiptData } from '@condo/domains/acquiring/hooks/usePosIntegrationLastTestingPosReceipt'
import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getDateRender,
    getTableCellRenderer, getStatusRender, getMoneyRender,
} from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'


type MarketplacePaymentsTableColumnsOptions = {
    lastTestingPosReceipt?: LastTestingPosReceiptData
    posIntegrationContext?: GetB2BAppContextWithPosIntegrationConfigQuery['contexts'][number]
}

export function useMarketplacePaymentTableColumns<T> (filterMetas: Array<FiltersMeta<T>>, openStatusDescModal: (statusType: string) => void, options: MarketplacePaymentsTableColumnsOptions = {}) {
    const intl = useIntl()
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const InvoiceNumberMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.invoiceNumber' })
    const TicketNumberMessage = intl.formatMessage({ id: 'Ticket' })
    const TransactionNumberMessage = intl.formatMessage({ id: 'Transaction' })
    const StatusMessage = intl.formatMessage({ id: 'Status' })
    const SumMessage = intl.formatMessage({ id: 'global.sum' })
    const PosReceiptColumnTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptColumn' })
    const PosReceiptLinkTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptLink' })
    const PosReceiptVerifyTitle = intl.formatMessage({ id: 'pages.condo.payments.posReceiptVerifyTitle' })
    const PosReceiptVerifyDescription = intl.formatMessage({ id: 'pages.condo.payments.posReceiptVerifyDescription' })

    const { publicRuntimeConfig: { condoRBDomain } } = getConfig()
    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const search = getFilteredValue(filters, 'search')

    const invoiceNumberRender = useCallback(payment => {
        const invoiceId = get(payment, 'invoice.id')
        const invoiceNumber = get(payment, 'invoice.number')

        if (!invoiceId) {
            return '—'
        }

        return getTableCellRenderer({ search, href: `marketplace/invoice/${invoiceId}`, target: '_blank' })(invoiceNumber)
    }, [search])

    const ticketNumberRender = useCallback(payment => {
        const ticketId = get(payment, 'invoice.ticket.id')
        const ticketNumber = get(payment, 'invoice.ticket.number')

        if (!ticketId) {
            return '—'
        }

        return getTableCellRenderer({ search, href: `/ticket/${ticketId}`, target: '_blank' })(ticketNumber)
    }, [search])

    const transactionNumberRender = useCallback(payment => {
        const multiPaymentId = get(payment, 'multiPayment.id')
        const transactionId = get(payment, 'multiPayment.transactionId')

        if (!transactionId) {
            return '—'
        }

        return getTableCellRenderer({ search, href: `${condoRBDomain}/check/${multiPaymentId}`, target: '_blank' })(transactionId)
    }, [condoRBDomain, search])

    return useMemo(() => {
        return [
            {
                title: DateMessage,
                sortOrder: get(sorterMap, 'createdAt'),
                filteredValue: getFilteredValue(filters, 'createdAt'),
                key: 'createdAt',
                dataIndex: 'createdAt',
                sorter: true,
                width: '105px',
                render: getDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'createdAt'),
            },
            {
                title: InvoiceNumberMessage,
                filteredValue: getFilteredValue(filters, 'invoiceNumber'),
                key: 'invoiceNumber',
                width: '20%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'invoiceNumber'),
                render: invoiceNumberRender,
                filterIcon: getFilterIcon,
            },
            {
                title: TicketNumberMessage,
                filteredValue: getFilteredValue(filters, 'ticketNumber'),
                key: 'ticketNumber',
                width: '20%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'ticketNumber'),
                render: ticketNumberRender,
                filterIcon: getFilterIcon,
            },
            {
                title: StatusMessage,
                key: 'status',
                dataIndex: 'status',
                width: '10%',
                filteredValue: getFilteredValue(filters, 'status'),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'status'),
                filterIcon: getFilterIcon,
                render: getStatusRender(intl, openStatusDescModal, search),
            },
            {
                title: SumMessage,
                key: 'amount',
                dataIndex: 'amount',
                width: '11%',
                render: getMoneyRender(intl),
            },
            options.posIntegrationContext ? {
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
        ].filter(Boolean)
    }, [DateMessage, sorterMap, filters, intl, search, filterMetas, InvoiceNumberMessage, invoiceNumberRender, TicketNumberMessage, ticketNumberRender, StatusMessage, openStatusDescModal, SumMessage, options.posIntegrationContext, options.lastTestingPosReceipt, PosReceiptColumnTitle, PosReceiptLinkTitle, PosReceiptVerifyTitle, PosReceiptVerifyDescription])
}

import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getDateRender,
    getTableCellRenderer, getStatusRender, getMoneyRender,
} from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'


export function useMarketplacePaymentTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, openStatusDescModal) {
    const intl = useIntl()
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const InvoiceNumberMessage = intl.formatMessage({ id: 'pages.condo.marketplace.payments.invoiceNumber' })
    const TicketNumberMessage = intl.formatMessage({ id: 'Ticket' })
    const TransactionNumberMessage = intl.formatMessage({ id: 'Transaction' })
    const StatusMessage = intl.formatMessage({ id: 'Status' })
    const SumMessage = intl.formatMessage({ id: 'global.sum' })

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
    }
    , [search])

    const ticketNumberRender = useCallback(payment => {
        const ticketId = get(payment, 'invoice.ticket.id')
        const ticketNumber = get(payment, 'invoice.ticket.number')

        if (!ticketId) {
            return '—'
        }

        return getTableCellRenderer({ search, href: `/ticket/${ticketId}`, target: '_blank' })(ticketNumber)
    }
    , [search])

    const transactionNumberRender = useCallback(payment => {
        return getTableCellRenderer({ search })('TODO(DOMA-7495) implement rendering of this field after task completion')
    }
    , [search])


    return useMemo(() => {
        return [
            {
                title: DateMessage,
                sortOrder: get(sorterMap, 'createdAt'),
                filteredValue: getFilteredValue(filters, 'createdAt'),
                key: 'createdAt',
                dataIndex: 'createdAt',
                sorter: true,
                width: '10%',
                render: getDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'createdAt'),
            },
            {
                title: InvoiceNumberMessage,
                filteredValue: getFilteredValue(filters, 'invoiceNumber'),
                key: 'invoiceNumber',
                width: '23%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'invoiceNumber'),
                render: invoiceNumberRender,
                filterIcon: getFilterIcon,
            },
            {
                title: TicketNumberMessage,
                filteredValue: getFilteredValue(filters, 'ticketNumber'),
                key: 'ticketNumber',
                dataIndex: ['ticket', 'number'],
                width: '23%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'ticketNumber'),
                render: ticketNumberRender,
                filterIcon: getFilterIcon,
            },
            {
                title: TransactionNumberMessage,
                filteredValue: getFilteredValue(filters, 'number'),
                dataIndex: ['importId'],
                key: 'number',
                width: '23%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                render: transactionNumberRender,
                filterIcon: getFilterIcon,
            },
            {
                title: StatusMessage,
                key: 'status',
                dataIndex: 'status',
                width: '10%',
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
        ]
    }, [sorterMap, filters, intl, search, filterMetas, SumMessage, StatusMessage, TransactionNumberMessage, DateMessage, TicketNumberMessage, InvoiceNumberMessage, transactionNumberRender, ticketNumberRender, invoiceNumberRender])
}

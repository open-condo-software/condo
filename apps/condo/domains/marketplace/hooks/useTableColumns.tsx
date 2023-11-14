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
import { MARKETPLACE_PAGE_TYPES, MarketplacePageTypes } from '@condo/domains/marketplace/utils/clientSchema'


export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, marketplacePageType: MarketplacePageTypes, openStatusDescModal) {
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
        const InvoiceId = get(payment, 'invoice.id')
        const invoiceNumber = get(payment, 'invoice.number')

        if (!InvoiceId) {
            return '—'
        }

        return getTableCellRenderer({ search, href: `marketplace/invoice/${InvoiceId}`, target: '_blank' })(invoiceNumber)
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
        switch (marketplacePageType) {
            case MARKETPLACE_PAGE_TYPES.payments:{
                return [
                    {
                        title: DateMessage,
                        sortOrder: get(sorterMap, 'date'),
                        filteredValue: getFilteredValue(filters, 'date'),
                        dataIndex: 'date',
                        key: 'date',
                        sorter: true,
                        width: '10%',
                        render: getDateRender(intl, search),
                        filterDropdown: getFilterDropdownByKey(filterMetas, 'date'),
                    },
                    {
                        title: InvoiceNumberMessage,
                        filteredValue: getFilteredValue(filters, 'invoiceNumber'),
                        dataIndex: ['invoice', 'number'],
                        key: 'invoiceNumber',
                        width: '10%',
                        filterDropdown: getFilterDropdownByKey(filterMetas, 'invoiceNumber'),
                        render: invoiceNumberRender,
                        filterIcon: getFilterIcon,
                    },
                    {
                        title: TicketNumberMessage,
                        filteredValue: getFilteredValue(filters, 'ticketNumber'),
                        dataIndex: ['invoice', 'ticket', 'number'],
                        key: 'ticketNumber',
                        width: '10%',
                        filterDropdown: getFilterDropdownByKey(filterMetas, 'ticketNumber'),
                        render: ticketNumberRender,
                        filterIcon: getFilterIcon,
                    },
                    {
                        title: TransactionNumberMessage,
                        filteredValue: getFilteredValue(filters, 'number'),
                        dataIndex: ['invoice'],
                        key: 'number',
                        width: '10%',
                        filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                        render: transactionNumberRender,
                        filterIcon: getFilterIcon,
                    },
                    {
                        title: StatusMessage,
                        key: 'status',
                        dataIndex: 'status',
                        render: getStatusRender(intl, openStatusDescModal, search),
                    },
                    {
                        title: SumMessage,
                        key: 'amount',
                        dataIndex: 'amount',
                        render: getMoneyRender(intl, 'RUB'),
                    },
                ]
            }
            case MARKETPLACE_PAGE_TYPES.services: {
                return []
            }
            case MARKETPLACE_PAGE_TYPES.bills: {
                return []
            }
        }
    }, [marketplacePageType, sorterMap, filters, intl, search, filterMetas, SumMessage, StatusMessage, TransactionNumberMessage, DateMessage, TicketNumberMessage, InvoiceNumberMessage, transactionNumberRender, ticketNumberRender, invoiceNumberRender])
}

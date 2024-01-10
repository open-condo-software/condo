import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tag } from '@open-condo/ui'

import { getDateRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { INVOICE_STATUS_COLORS } from '@condo/domains/marketplace/constants'
import { getMoneyRender } from '@condo/domains/marketplace/utils/clientSchema/Invoice'


export const useMarketplaceInvoicesTableColumns = ({ filtersMeta }) => {
    const intl = useIntl()
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const InvoiceNumberTitle = intl.formatMessage({ id: 'pages.condo.marketplace.payments.invoiceNumber' })
    const RowsTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.title.order' })
    const PaymentTypeTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.paymentType' })
    const StatusTitle = intl.formatMessage({ id: 'Status' })
    const SumTitle = intl.formatMessage({ id: 'global.sum' })
    const ContractPriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.contractPrice' }).toLowerCase()
    const TicketNumber = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.invoiceList.ticketNumber' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const search = getFilteredValue(filters, 'search')
    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    return useMemo(() => [
        {
            title: DateTitle,
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '105px',
            render: getDateRender(intl, String(search)),
            sorter: true,
            sortOrder: get(sorterMap, 'createdAt'),
        },
        {
            title: InvoiceNumberTitle,
            key: 'number',
            dataIndex: 'number',
            width: '15%',
            render: (number, invoice) => {
                const renderInvoiceNumber = getTableCellRenderer({ search, href: `/marketplace/invoice/${invoice.id}`, target: '_blank' })

                return renderInvoiceNumber(`№${number}`)
            },
            sorter: true,
            sortOrder: get(sorterMap, 'number'),
            filteredValue: getFilteredValue(filters, 'number'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'number'),
            filterIcon: getFilterIcon,
        },
        {
            title: TicketNumber,
            key: 'ticket',
            dataIndex: 'ticket',
            width: '15%',
            render: (ticket) => {
                if (!ticket) {
                    return '—'
                }

                const renderTicketNumber = getTableCellRenderer({ search, href: `/ticket/${ticket.id}`, target: '_blank' })

                return renderTicketNumber(`№${ticket.number}`)
            },
            sorter: true,
            sortOrder: get(sorterMap, 'ticket'),
            filteredValue: getFilteredValue(filters, 'ticket'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'ticket'),
            filterIcon: getFilterIcon,
        },
        {
            title: RowsTitle,
            key: 'rows',
            dataIndex: 'rows',
            width: '25%',
            render: (rows) => {
                const joinedRows = rows.map((row, index) => {
                    const name = row.name
                    return index > 0 ? name.toLowerCase() : name
                }).join(', ')

                const shortenRows = joinedRows.length > 450 ? `${joinedRows.substring(0, 450)}…` : joinedRows

                return render(shortenRows)
            },
        },
        {
            title: PaymentTypeTitle,
            key: 'paymentType',
            dataIndex: 'paymentType',
            width: '15%',
            render: (paymentType) => {
                const label = intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.payment.${paymentType}` })

                return render(label)
            },
            filteredValue: getFilteredValue(filters, 'paymentType'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'paymentType'),
            filterIcon: getFilterIcon,
        },
        {
            title: StatusTitle,
            key: 'status',
            dataIndex: 'status',
            width: '20%',
            render: (status) => {
                const label = intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.${status}` })

                return (
                    <Tag
                        bgColor={INVOICE_STATUS_COLORS[status].bgColor}
                        textColor={INVOICE_STATUS_COLORS[status].color}
                    >
                        {label}
                    </Tag>
                )
            },
            filteredValue: getFilteredValue(filters, 'status'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'status'),
            filterIcon: getFilterIcon,
        },
        {
            title: SumTitle,
            key: 'toPay',
            dataIndex: 'rows',
            width: '10%',
            render: (rows) => {
                const totalPrice = rows.filter(row => row.toPay !== '0').reduce((acc, row) => acc + Number(row.toPay) * row.count, 0)
                const hasMinPrice = rows.some(row => row.isMin)
                const isContractToPay = rows.every(row => row.isMin && row.toPay === '0')
                const currencyCode = get(rows, ['0', 'currencyCode'], 'RUB')
                const moneyRender = getMoneyRender(intl, currencyCode)

                return isContractToPay ? ContractPriceMessage : moneyRender(totalPrice, hasMinPrice)
            },
            sorter: true,
            sortOrder: get(sorterMap, 'toPay'),
            filteredValue: getFilteredValue(filters, 'toPay'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'toPay'),
            filterIcon: getFilterIcon,
        },
    ], [ContractPriceMessage, DateTitle, InvoiceNumberTitle, PaymentTypeTitle, RowsTitle, StatusTitle, SumTitle, TicketNumber, filters, filtersMeta, intl, render, search, sorterMap])
}
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tag } from '@open-condo/ui'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import { getDateRender, getAddressRender, getTableCellRenderer, getUnitNameRender } from '@condo/domains/common/components/Table/Renders'
import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { INVOICE_STATUS_COLORS } from '@condo/domains/marketplace/constants'
import { getMoneyRender } from '@condo/domains/marketplace/utils/clientSchema/Invoice'

const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()

export const useMarketplaceInvoicesTableColumns = ({ filtersMeta }) => {
    const intl = useIntl()
    const DateTitle = intl.formatMessage({ id: 'Date' })
    const InvoiceNumberTitle = intl.formatMessage({ id: 'pages.condo.marketplace.payments.invoiceNumber' })
    const AddressTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.address' })
    const UnitTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.field.unitName' })
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

    const renderNumber = useCallback((number, invoice) => {
        const renderInvoiceNumber = getTableCellRenderer({ search, href: `/marketplace/invoice/${invoice.id}`, target: '_blank' })

        return renderInvoiceNumber(`№${number}`)
    }, [search])

    const renderTicket = useCallback((ticket) => {
        if (!ticket) {
            return '—'
        }

        const renderTicketNumber = getTableCellRenderer({ search, href: `/ticket/${ticket.id}`, target: '_blank' })

        return renderTicketNumber(`№${ticket.number}`)
    }, [search])

    const renderAddress = useCallback((property) => {
        return getAddressRender(property, null, search)
    }, [search])

    const renderUnitName = useCallback((text, invoice) => {
        return getUnitNameRender(intl, text, invoice, search)
    }, [intl, search])

    const renderRows = useCallback((rows) => {
        const joinedRows = rows.map((row, index) => {
            const name = row.name
            return index > 0 ? name.toLowerCase() : name
        }).join(', ')

        const shortenRows = joinedRows.length > 450 ? `${joinedRows.substring(0, 450)}…` : joinedRows

        return render(shortenRows)
    }, [render])

    const renderPaymentTypes = useCallback((paymentType) => {
        const label = intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.payment.${paymentType}` as FormatjsIntl.Message['ids'] })

        return render(label)
    }, [intl, render])

    const renderStatus = useCallback((status) => {
        const label = intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceList.${status}` as FormatjsIntl.Message['ids'] })

        return (
            <Tag
                bgColor={INVOICE_STATUS_COLORS[status].bgColor}
                textColor={INVOICE_STATUS_COLORS[status].color}
            >
                {label}
            </Tag>
        )
    }, [intl])

    const renderSum = useCallback((rows) => {
        const totalPrice = rows.filter(row => row.toPay !== '0').reduce((acc, row) => acc + Number(row.toPay) * row.count, 0)
        const hasMinPrice = rows.some(row => row.isMin)
        const isContractToPay = rows.every(row => row.isMin && row.toPay === '0')
        const currencyCode = rows?.[0]?.currencyCode || defaultCurrencyCode
        const moneyRender = getMoneyRender(intl, currencyCode)

        return isContractToPay ? ContractPriceMessage : moneyRender(totalPrice, hasMinPrice)
    }, [ContractPriceMessage, intl])

    return useMemo(() => [
        {
            title: DateTitle,
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '105px',
            render: getDateRender(intl, String(search)),
            sorter: true,
            sortOrder: sorterMap?.createdAt,
        },
        {
            title: InvoiceNumberTitle,
            key: 'number',
            dataIndex: 'number',
            width: '10%',
            render: renderNumber,
            sorter: true,
            sortOrder: sorterMap?.number,
            filteredValue: getFilteredValue(filters, 'number'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'number'),
            filterIcon: getFilterIcon,
        },
        {
            title: TicketNumber,
            key: 'ticket',
            dataIndex: 'ticket',
            width: '10%',
            render: renderTicket,
            sorter: true,
            sortOrder: sorterMap?.ticket,
            filteredValue: getFilteredValue(filters, 'ticket'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'ticket'),
            filterIcon: getFilterIcon,
        },
        {
            title: AddressTitle,
            key: 'property',
            dataIndex: 'property',
            width: '15%',
            render: renderAddress,
            sorter: true,
            sortOrder: sorterMap?.property,
            filteredValue: getFilteredValue(filters, 'property'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'property'),
            filterIcon: getFilterIcon,
        },
        {
            title: UnitTitle,
            key: 'unitName',
            dataIndex: 'unitName',
            width: '9%',
            render: renderUnitName,
            sorter: true,
            sortOrder: sorterMap?.unitName,
            filteredValue: getFilteredValue(filters, 'unitName'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'unitName'),
            filterIcon: getFilterIcon,
            ellipsis: true,
        },
        {
            title: RowsTitle,
            key: 'rows',
            dataIndex: 'rows',
            width: '13%',
            render: renderRows,
        },
        {
            title: PaymentTypeTitle,
            key: 'paymentType',
            dataIndex: 'paymentType',
            width: '10%',
            render: renderPaymentTypes,
            filteredValue: getFilteredValue(filters, 'paymentType'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'paymentType'),
            filterIcon: getFilterIcon,
        },
        {
            title: StatusTitle,
            key: 'status',
            dataIndex: 'status',
            width: '20%',
            render: renderStatus,
            filteredValue: getFilteredValue(filters, 'status'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'status'),
            filterIcon: getFilterIcon,
        },
        {
            title: SumTitle,
            key: 'toPay',
            dataIndex: 'rows',
            width: '13%',
            render: renderSum,
            sorter: true,
            sortOrder: sorterMap?.toPay,
            filteredValue: getFilteredValue(filters, 'toPay'),
            filterDropdown: getFilterDropdownByKey(filtersMeta, 'toPay'),
            filterIcon: getFilterIcon,
        },
    ], [intl, DateTitle, InvoiceNumberTitle, PaymentTypeTitle, RowsTitle, AddressTitle, renderAddress, renderUnitName, UnitTitle, StatusTitle, SumTitle, TicketNumber, filters, filtersMeta, search, sorterMap, renderSum, renderNumber, renderRows, renderStatus, renderTicket, renderPaymentTypes])
}
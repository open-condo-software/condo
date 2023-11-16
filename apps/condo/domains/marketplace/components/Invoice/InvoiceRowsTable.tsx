import { Col, Row, RowProps, Table as AntdTable } from 'antd'
import get from 'lodash/get'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import { Table } from '@condo/domains/common/components/Table'
import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { MarketItem } from '@condo/domains/marketplace/utils/clientSchema'
import {
    prepareTotalPriceFromInput,
    getMoneyRender,
    calculateRowsTotalPrice,
} from '@condo/domains/marketplace/utils/clientSchema/Invoice'


const MEDIUM_VERTICAL_GUTTER: RowProps['gutter'] = [0, 24]

const useInvoiceRowsTableColumns = (currencyCode, marketItems) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.name' })
    const SkuMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.sku' })
    const CountMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.count' })
    const PriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.price' })
    const ToPayMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.toPay' })

    const render = useMemo(() => getTableCellRenderer(), [])
    const renderWithEmptyValue = useCallback((value) => {
        if (!value) return '—'

        return render(value)
    }, [render])
    const moneyRender = useMemo(() => getMoneyRender(intl, currencyCode), [currencyCode, intl])
    const toPayRender = useCallback((row, count) => {
        const rawPrice = get(row, 'toPay')
        const { error, isMin, total } = prepareTotalPriceFromInput(intl, count, rawPrice)
        const value = error ? '' : moneyRender(String(total), isMin)

        return renderWithEmptyValue(value)
    }, [intl, moneyRender, renderWithEmptyValue])
    const renderMarketItemName = useCallback((value, row) => {
        const sku = get(row, 'sku')
        if (!sku) {
            return render(value)
        }

        const marketItemWithSameSku = marketItems.find(marketItem => marketItem.sku === sku)
        if (!marketItemWithSameSku) {
            return render(value)
        }

        const renderLink = getTableCellRenderer({ href: `/marketplace/marketItem/${marketItemWithSameSku.id}` })
        return renderLink(value)
    }, [marketItems, render])

    return [
        {
            title: NameMessage,
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            render: renderMarketItemName,
        },
        {
            title: SkuMessage,
            dataIndex: 'sku',
            key: 'sku',
            width: '23%',
            render: renderWithEmptyValue,
        },
        {
            title: CountMessage,
            dataIndex: 'count',
            key: 'count',
            width: '9%',
            render,
        },
        {
            title: PriceMessage,
            dataIndex: 'toPay',
            key: 'toPay',
            width: '19%',
            render: (_, row) => toPayRender(row, 1),
        },
        {
            title: ToPayMessage,
            key: 'totalToPay',
            width: '19%',
            render: (row) => toPayRender(row, get(row, 'count')),
        },
    ]
}

export const InvoiceRowsTable = ({ invoice }) => {
    const intl = useIntl()
    const OrderTitle = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.title.order' })

    const currencyCode = get(invoice, 'context.currencyCode')
    const rows = useMemo(() => get(invoice, 'rows'), [invoice])
    const organizationId = get(invoice, 'context.organization.id')
    const skuItems = rows.map(({ sku }) => sku).filter(Boolean)

    const { objs: marketItems, loading: marketItemsLoading } = MarketItem.useObjects({
        where: {
            sku_in: skuItems,
            organization: { id: organizationId },
        },
    })

    const orderColumns = useInvoiceRowsTableColumns(currencyCode, marketItems)

    const moneyRender = useMemo(() => getMoneyRender(intl, currencyCode), [currencyCode, intl])
    const { totalPrice, hasMinPrice } = calculateRowsTotalPrice(intl, rows)
    const SummaryContent = useCallback(() => (
        <AntdTable.Summary fixed>
            <AntdTable.Summary.Row>
                {
                    Array.from({ length: orderColumns.length - 1 }, (_, index) => index)
                        .map(index => <AntdTable.Summary.Cell key={index} index={index} colSpan={1} />)
                }
                <AntdTable.Summary.Cell index={orderColumns.length} colSpan={1}>
                    <Typography.Text strong>{moneyRender(totalPrice, hasMinPrice)}</Typography.Text>
                </AntdTable.Summary.Cell>
            </AntdTable.Summary.Row>
        </AntdTable.Summary>
    ), [hasMinPrice, moneyRender, orderColumns.length, totalPrice])

    return (
        <Row gutter={MEDIUM_VERTICAL_GUTTER}>
            <Col span={24}>
                <Typography.Title level={4}>{OrderTitle}</Typography.Title>
            </Col>
            <Col span={24}>
                <Table
                    totalRows={rows.length}
                    loading={marketItemsLoading}
                    dataSource={rows}
                    columns={orderColumns}
                    pagination={false}
                    summary={SummaryContent}
                />
            </Col>
        </Row>
    )
}
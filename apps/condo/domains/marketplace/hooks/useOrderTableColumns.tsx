import get from 'lodash/get'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { prepareTotalPriceFromInput, getMoneyRender } from '@condo/domains/marketplace/utils/clientSchema/Invoice'


export const useOrderTableColumns = (currencyCode, marketItems) => {
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
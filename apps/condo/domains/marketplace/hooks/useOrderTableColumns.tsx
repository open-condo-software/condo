import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { IFilters } from '@app/callcenter/domains/contact/utils/helpers'

import { getTableCellRenderer } from '../../common/components/Table/Renders'
import { getFilterIcon } from '../../common/components/TableFilter'
import { getFilterDropdownByKey } from '../../common/utils/filters.utils'
import { getFilteredValue } from '../../common/utils/helpers'

export const useOrderTableColumns = () => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.name' })
    const SkuMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.sku' })
    const CountMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.count' })
    const PriceMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.price' })
    const ToPayMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.id.table.header.toPay' })

    const render = useMemo(() => getTableCellRenderer(), [])

    return [
        {
            title: NameMessage,
            dataIndex: 'name',
            key: 'name',
            // width: '19%',
            render,
        },
        {
            title: SkuMessage,
            dataIndex: 'sku',
            key: 'sku',
            // width: '19%',
            render,
        },
        {
            title: CountMessage,
            dataIndex: 'count',
            key: 'count',
            // width: '19%',
            render,
        },
        {
            title: PriceMessage,
            dataIndex: 'toPay',
            key: 'toPay',
            // width: '19%',
            render,
        },
    ]
}
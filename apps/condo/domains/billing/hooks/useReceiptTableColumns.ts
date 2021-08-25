import { useMemo } from 'react'
import { useRouter } from 'next/router'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { getFilterIcon, getTextFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getMoneyRender, getTextRender } from '@condo/domains/common/components/Table/Renders'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'

export const useReceiptTableColumns = (detailed = false) => {
    const intl = useIntl()
    const AddressTitle = intl.formatMessage({ id: 'field.Address' })
    const AccountTitle = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const ToPayTitle = intl.formatMessage({ id: 'field.TotalPayment' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        return [
            {
                title: AddressTitle,
                key: 'address',
                dataIndex: ['property', 'address'],
                sorter: false,
                filteredValue: get(filters, 'address'),
                width: detailed ? '38%' : '50%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(AddressTitle),
                render: getTextRender(search),
            },
            {
                title: AccountTitle,
                key: 'account',
                dataIndex: ['account', 'number'],
                sorter: false,
                filteredValue: get(filters, 'account'),
                width: detailed ? '22%' : '30%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(AccountTitle),
                render: getTextRender(search),
            },
            {
                title: ToPayTitle,
                key: 'toPay',
                dataIndex: ['toPay'],
                sorter: true,
                sortOrder: get(sorterMap, 'toPay'),
                filteredValue: get(filters, 'toPay'),
                width: detailed ? '10%' : '20%',
                filterIcon: getFilterIcon,
                filterDropdown: getTextFilterDropdown(ToPayTitle),
                // TODO (savelevMatthew): More complex logic when will be able to support other currency, separators
                render: getMoneyRender(search),
            },
        ]
    }, [AddressTitle, AccountTitle, ToPayTitle, filters, sorterMap, detailed])
}
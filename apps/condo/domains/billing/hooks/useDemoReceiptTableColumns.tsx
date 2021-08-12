import { createSorterMap, IFilters } from '../utils/helpers'
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'
import React, { useMemo } from 'react'
import { useIntl } from '@core/next/intl'
import { isEmpty } from 'lodash'
import { Highliter } from '@condo/domains/common/components/Highliter'
import { Typography } from 'antd'
import { colors } from '@condo/domains/common/constants/style'
import { EmptyTableCell } from '@condo/domains/common/components/EmptyTableCell'
import { getFilterIcon, getTextFilterDropdown } from '@condo/domains/common/components/TableFilter'

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

// TODO (SavelevMatthew): create common hook later
export const useDemoReceiptTableColumns = (
    sort: Array<string>,
    filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const AccountNumberMessage = intl.formatMessage({ id: 'field.AccountNumberShort' })
    const TotalPaymentMessage = intl.formatMessage({ id: 'field.TotalPayment' })

    const sorterMap = createSorterMap(sort)

    const search = getFilteredValue(filters, 'search')

    const render = (text) => {
        let result = text
        if (!isEmpty(search) && text) {
            result = (
                <Highliter
                    text={`${text}`}
                    search={String(search)}
                    renderPart={(part) => (
                        <Typography.Text style={{ backgroundColor: colors.markColor }}>
                            {part}
                        </Typography.Text>
                    )}
                />
            )
        }
        return (<EmptyTableCell>{result}</EmptyTableCell>)
    }

    return useMemo(() => {
        return [
            {
                title: AddressMessage,
                sortOrder: get(sorterMap, 'address'),
                ellipsis: true,
                filteredValue: getFilteredValue(filters, 'address'),
                dataIndex: ['property', 'address'],
                key: 'address',
                sorter: false,
                width: '50%',
                filterDropdown: getTextFilterDropdown(AddressMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: AccountNumberMessage,
                sortOrder: get(sorterMap, 'account'),
                ellipsis: true,
                filteredValue: getFilteredValue(filters, 'account'),
                dataIndex: ['account', 'number'],
                key: 'account',
                sorter: false,
                width: '30%',
                filterDropdown: getTextFilterDropdown(AccountNumberMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: TotalPaymentMessage,
                sortOrder: get(sorterMap, 'toPay'),
                ellipsis: true,
                filteredValue: getFilteredValue(filters, 'toPay'),
                dataIndex: ['toPay'],
                key: 'toPay',
                sorter: true,
                width: '20%',
                filterDropdown: getTextFilterDropdown(TotalPaymentMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: (text) => render(`${text} ₽`),
            },
        ]
    }, [sort, filters])
}
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import React, { useMemo } from 'react'
import { getAddressDetails, getIntlMessages, MessageSetMeta } from '@condo/domains/common/utils/helpers'
import { getTextFilterDropdown, getFilterIcon } from '@condo/domains/common/components/TableFilter'
import getRenderer from '@condo/domains/common/components/helpers/tableCellRenderer'

import { createSorterMap, IFilters } from '../utils/helpers'

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

type TableMessageKeys = 'NameMessage' | 'PhoneMessage' | 'EmailMessage' | 'AddressMessage' | 'ShortFlatNumber'

const TABLE_MESSAGES: MessageSetMeta<TableMessageKeys> = {
    NameMessage: { id: 'field.FullName.short' },
    PhoneMessage: { id: 'Phone' },
    EmailMessage: { id: 'field.EMail' },
    AddressMessage: { id: 'pages.condo.property.field.Address' },
    ShortFlatNumber: { id: 'field.FlatNumber' },
}

export const useTableColumns = (
    sort: Array<string>,
    filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const intl = useIntl()
    const messages = getIntlMessages<TableMessageKeys>(intl, TABLE_MESSAGES)

    const sorterMap = createSorterMap(sort)
    const search = getFilteredValue(filters, 'search')

    const renderAddress = (address, record) => {
        const { text, unitPrefix } = getAddressDetails(record, messages.ShortFlatNumber)

        return getRenderer(search, true, unitPrefix)(text)
    }

    return useMemo(() => {
        return [
            {
                title: messages.NameMessage,
                sortOrder: get(sorterMap, 'name'),
                filteredValue: getFilteredValue(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                width: '20%',
                filterDropdown: getTextFilterDropdown(messages.NameMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: getRenderer(search),
                ellipsis: true,
            },
            {
                title: messages.AddressMessage,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                dataIndex: ['property', 'address'],
                key: 'address',
                sorter: false,
                width: '45%',
                filterDropdown: getTextFilterDropdown(messages.AddressMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: renderAddress,
            },
            {
                title: messages.PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '15%',
                filterDropdown: getTextFilterDropdown(messages.PhoneMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: getRenderer(search),
            },
            {
                title: messages.EmailMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'email'),
                filteredValue: getFilteredValue(filters, 'email'),
                dataIndex: 'email',
                key: 'email',
                sorter: true,
                width: '20%',
                filterDropdown: getTextFilterDropdown(messages.EmailMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: getRenderer(search),
            },
        ]
    }, [sort, filters])
}

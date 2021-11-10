import React, { useCallback, useMemo } from 'react'
import get from 'lodash/get'

import { useIntl } from '@core/next/intl'

import { getAddressDetails, getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getTextFilterDropdown, getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getAddressRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'

import { createSorterMap, IFilters } from '../utils/helpers'

export const useTableColumns = (
    sort: Array<string>,
    filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneMessage =  intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

    const sorterMap = createSorterMap(sort)
    const search = getFilteredValue(filters, 'search')
    const render = getTableCellRenderer(search)

    const renderAddress = useCallback(
        (_, contact) => getAddressRender(get(contact, 'property'), DeletedMessage, search),
        [DeletedMessage, search])


    return useMemo(() => {
        return [
            {
                title: NameMessage,
                sortOrder: get(sorterMap, 'name'),
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                width: '20%',
                filterDropdown: getTextFilterDropdown(NameMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
                ellipsis: true,
            },
            {
                title: AddressMessage,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue<IFilters>(filters, 'address'),
                dataIndex: ['property', 'address'],
                key: 'address',
                sorter: false,
                width: '45%',
                filterDropdown: getTextFilterDropdown(AddressMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: renderAddress,
            },
            {
                title: PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue<IFilters>(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '15%',
                filterDropdown: getTextFilterDropdown(PhoneMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: EmailMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'email'),
                filteredValue: getFilteredValue<IFilters>(filters, 'email'),
                dataIndex: 'email',
                key: 'email',
                sorter: true,
                width: '20%',
                filterDropdown: getTextFilterDropdown(EmailMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render,
            },
        ]
    }, [sort, filters])
}

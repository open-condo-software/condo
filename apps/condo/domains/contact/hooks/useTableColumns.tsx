import React, { useCallback, useMemo } from 'react'
import get from 'lodash/get'
import { useRouter } from 'next/router'

import { useIntl } from '@core/next/intl'

import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import {
    getAddressRender,
    getTableCellRenderer,
    getUnitNameRender,
} from '@condo/domains/common/components/Table/Renders'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'

import { IFilters } from '../utils/helpers'
import { Contact } from '@app/condo/schema'

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneMessage =  intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const RoleMessage = intl.formatMessage({ id: 'ContactRole' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const search = getFilteredValue(filters, 'search')

    const renderAddress = useCallback(
        (_, contact) => getAddressRender(get(contact, 'property'), DeletedMessage, search),
        [DeletedMessage, search])

    const renderUnitName = useCallback(
        (text, contact) => getUnitNameRender<Contact>(intl, text, contact, search)
        , [search])

    const render = useMemo(() => getTableCellRenderer(search), [search])

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
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
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
                width: '35%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                filterIcon: getFilterIcon,
                render: renderAddress,
            },
            {
                title: UnitMessage,
                dataIndex: 'unitName',
                sortOrder: get(sorterMap, 'unitName'),
                filteredValue: getFilteredValue(filters, 'unitName'),
                key: 'unitName',
                sorter: true,
                width: '15%',
                render: renderUnitName,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'unitName'),
                filterIcon: getFilterIcon,
            },
            {
                title: PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue<IFilters>(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '15%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'phone'),
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
                filterDropdown: getFilterDropdownByKey(filterMetas, 'email'),
                filterIcon: getFilterIcon,
                render,
            },
            {
                title: RoleMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'role'),
                filteredValue: getFilteredValue<IFilters>(filters, 'role'),
                dataIndex: 'role',
                key: 'role',
                sorter: true,
                width: '20%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'role'),
                filterIcon: getFilterIcon,
                render: (role) => render(get(role, 'name')),
            },
        ]
    }, [AddressMessage, EmailMessage, NameMessage, PhoneMessage, RoleMessage, filterMetas, filters, render, renderAddress, sorterMap, renderUnitName])
}

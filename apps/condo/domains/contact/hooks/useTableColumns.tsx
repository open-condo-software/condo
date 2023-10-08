import { Contact, ContactWhereInput } from '@app/condo/schema'
import { ColumnsType, ColumnType } from 'antd/es/table/interface'
import get from 'lodash/get'
import identity from 'lodash/identity'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { getOptionFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import {
    getAddressRender,
    getTableCellRenderer,
    getUnitNameRender,
} from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { ContactRole } from '@condo/domains/contact/utils/clientSchema'
import { IFilters } from '@condo/domains/contact/utils/helpers'

type UseTableColumns = (filterMetas: Array<FiltersMeta<ContactWhereInput>>) => ColumnsType<Contact>
export const useTableColumns: UseTableColumns = (filterMetas) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneMessage =  intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const RoleMessage = intl.formatMessage({ id: 'ContactRole' })

    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)
    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const search = getFilteredValue(filters, 'search')

    const { objs: contactRoles, loading } = ContactRole.useObjects({
        where: {
            OR: [
                { organization_is_null: true },
                { organization: { id: organizationId } },
            ],
        },
    })

    const renderAddress = useCallback(
        (_, contact) => getAddressRender(get(contact, 'property'), DeletedMessage, search),
        [DeletedMessage, search])

    const renderUnitName = useCallback(
        (text, contact) => getUnitNameRender<Contact>(intl, text, contact, search)
        , [search])

    const renderRolesFilterDropdown: ColumnType<Contact>['filterDropdown'] = useCallback((filterProps) => {
        const adaptedRoles = contactRoles.map(ContactRole.convertGQLItemToFormSelectState).filter(identity)
        return getOptionFilterDropdown({ checkboxGroupProps: { options: adaptedRoles, disabled: loading } })(filterProps)
    }, [contactRoles, loading])

    const render = useMemo(() => getTableCellRenderer({ search }), [search])

    const renderPhone = useCallback((phone) => {
        return getTableCellRenderer({ search, href: `tel:${phone}` })(phone)
    }, [search])

    const renderEmail = useCallback((email) => {
        return getTableCellRenderer({ search, href: `mailto:${email}` })(email)
    }, [search])

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
                title: RoleMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'role'),
                filteredValue: getFilteredValue<IFilters>(filters, 'role'),
                dataIndex: 'role',
                key: 'role',
                sorter: true,
                width: '20%',
                filterDropdown: renderRolesFilterDropdown,
                filterIcon: getFilterIcon,
                render: (role) => render(get(role, 'name')),
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
                render: renderPhone,
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
                render: renderEmail,
            },
        ]
    }, [NameMessage, sorterMap, filters, filterMetas, render, AddressMessage, renderAddress, RoleMessage, renderRolesFilterDropdown, UnitMessage, renderUnitName, PhoneMessage, renderPhone, EmailMessage, renderEmail])
}

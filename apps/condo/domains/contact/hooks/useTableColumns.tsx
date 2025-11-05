import { GetContactsForTableQuery } from '@app/condo/gql'
import { 
    Contact, 
    ContactWhereInput, 
    OrganizationEmployeeRole,
} from '@app/condo/schema'
import { ColumnsType, ColumnType } from 'antd/es/table/interface'
import identity from 'lodash/identity'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { TableColumn, TableRef } from '@open-condo/ui'

import { getOptionFilterDropdown, getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import {
    getAddressRender, 
    getDateRender,
    getTableCellRenderer,
    getUnitNameRender,
    getUnitTypeRender,
} from '@condo/domains/common/components/Table/Renders'
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
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const RoleMessage = intl.formatMessage({ id: 'ContactRole' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const NoMessage = intl.formatMessage({ id: 'No' })
    const AddedDateMessage = intl.formatMessage({ id: 'AddedDate' })
    const IsVerifiedMessage = intl.formatMessage({ id: 'contact.column.header.isVerified' })

    const { organization } = useOrganization()
    const organizationId = organization?.id || null
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
        (_, contact) => getAddressRender(contact?.property, DeletedMessage, search),
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

    const renderIsVerified = useCallback((isVerified) => render(isVerified ? YesMessage : NoMessage),
        [NoMessage, YesMessage, render])

    return useMemo(() => {
        return [
            {
                title: NameMessage,
                sortOrder: sorterMap?.name,
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                width: '15%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                filterIcon: getFilterIcon,
                render,
                ellipsis: true,
            },
            {
                title: AddressMessage,
                sortOrder: sorterMap?.address,
                filteredValue: getFilteredValue<IFilters>(filters, 'address'),
                dataIndex: ['property', 'address'],
                key: 'address',
                sorter: false,
                width: '20%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                filterIcon: getFilterIcon,
                render: renderAddress,
            },
            {
                title: RoleMessage,
                ellipsis: true,
                sortOrder: sorterMap?.role,
                filteredValue: getFilteredValue<IFilters>(filters, 'role'),
                dataIndex: 'role',
                key: 'role',
                sorter: true,
                width: '15%',
                filterDropdown: renderRolesFilterDropdown,
                filterIcon: getFilterIcon,
                render: (role: OrganizationEmployeeRole) => render(role?.name ?? '—'),
            },
            {
                title: UnitMessage,
                dataIndex: 'unitName',
                sortOrder: sorterMap?.unitName,
                filteredValue: getFilteredValue(filters, 'unitName'),
                key: 'unitName',
                sorter: true,
                width: '10%',
                render: renderUnitName,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'unitName'),
                filterIcon: getFilterIcon,
            },
            {
                title: AddedDateMessage,
                dataIndex: 'createdAt',
                sortOrder: sorterMap?.createdAt,
                filteredValue: getFilteredValue(filters, 'createdAt'),
                key: 'createdAt',
                sorter: true,
                width: '15%',
                render: getDateRender(intl, String(search)),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'createdAt'),
                filterIcon: getFilterIcon,
            },
            {
                title: PhoneMessage,
                sortOrder: sorterMap?.phone,
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
                title: IsVerifiedMessage,
                dataIndex: 'isVerified',
                sortOrder: sorterMap?.isVerified,
                filteredValue: getFilteredValue(filters, 'isVerified'),
                key: 'isVerified',
                sorter: true,
                width: '15%',
                render: renderIsVerified,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'isVerified'),
                filterIcon: getFilterIcon,
            },
        ]
    }, [
        NameMessage, sorterMap, filters, filterMetas, render, AddressMessage, renderAddress, RoleMessage,
        renderRolesFilterDropdown, UnitMessage, renderUnitName, AddedDateMessage, intl, search, PhoneMessage,
        renderPhone, IsVerifiedMessage, renderIsVerified,
    ])
}


type UseNewTableColumns = (filterMetas: Array<FiltersMeta<ContactWhereInput>>, tableRef: TableRef | null) => TableColumn<GetContactsForTableQuery['contacts'][number]>[]
export const useNewTableColumns: UseNewTableColumns = (filterMetas, tableRef) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.field.Address' })
    const RoleMessage = intl.formatMessage({ id: 'ContactRole' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const UnitTypeMessage = intl.formatMessage({ id: 'field.UnitType' })
    const AddedDateMessage = intl.formatMessage({ id: 'AddedDate' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const IsVerifiedMessage = intl.formatMessage({ id: 'contact.column.header.isVerified' })
    const EmailMessage = intl.formatMessage({ id: 'Email' })
    const OwnershipPercentageMessage = intl.formatMessage({ id: 'contact.column.header.ownershipPercentage' })
    const NoteMessage = intl.formatMessage({ id: 'contact.column.header.note' })
    const CommunityFeeMessage = intl.formatMessage({ id: 'contact.column.header.communityFee' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const NoMessage = intl.formatMessage({ id: 'No' })

    const search = useMemo(() => tableRef?.api.getColumnFilter('search') as string | undefined, [tableRef])

    const { organization } = useOrganization()
    const organizationId = organization?.id || null

    const { objs: contactRoles, loading } = ContactRole.useObjects({
        where: {
            OR: [
                { organization_is_null: true },
                { organization: { id: organizationId } },
            ],
        },
    })

    const renderRolesFilterDropdown = useCallback((filterProps) => {
        const adaptedRoles = contactRoles.map(ContactRole.convertGQLItemToFormSelectState).filter(identity)
        return getOptionFilterDropdown({ checkboxGroupProps: { options: adaptedRoles, disabled: loading } })(filterProps)
    }, [contactRoles, loading])

    const renderCell = useMemo(() => getTableCellRenderer({ search }), [search])

    const renderAddress = useCallback(
        (_, contact) => getAddressRender(contact?.property, DeletedMessage, search)
        , [DeletedMessage, search])

    const renderUnitName = useCallback(
        (text, contact) => getUnitNameRender<Contact>(intl, text, contact, search)
        , [search, intl])

    const renderUnitType = useCallback(
        (text, contact) => getUnitTypeRender<Contact>(intl, text, contact, search)
        , [search, intl])

    const renderRole = useCallback(
        (role: OrganizationEmployeeRole) => renderCell(role?.name ?? '—')
        , [renderCell])

    const renderDate = useCallback(
        (date) => getDateRender(intl, String(search))(date),
        [search, intl])

    const renderPhone = useCallback(
        (phone) => getTableCellRenderer({ search, href: `tel:${phone}` })(phone ?? '—')
        , [search])

    const renderEmail = useCallback(
        (email) => getTableCellRenderer({ search, href: email ? `mailto:${email}` : undefined })(email ?? '—')
        , [search])

    const renderIsVerified = useCallback(
        (isVerified) => renderCell(isVerified ? YesMessage : NoMessage)
        , [NoMessage, YesMessage, renderCell])

    const renderOwnershipPercentage = useCallback(
        (ownershipPercentage) => renderCell(ownershipPercentage ?? '—')
        , [renderCell])

    const renderNote = useCallback(
        (note) => renderCell(note ?? '—')
        , [renderCell])

    const renderCommunityFee = useCallback(
        (communityFee) => renderCell(communityFee ?? '—')
        , [renderCell])




    
    

    return useMemo(() => {
        return [
            {
                header: NameMessage,
                dataKey: 'name',
                id: 'name',
                render: renderCell,
            },
            {
                header: AddressMessage,
                dataKey: (record) => record.property?.address,
                id: 'address',
                enableSorting: false,
                render: renderAddress,
                // filterComponent: 
            },
            {
                header: RoleMessage,
                dataKey: 'role',
                id: 'role',
                render: renderRole,
                filterComponent: renderRolesFilterDropdown,
            },
            {
                header: UnitMessage,
                dataKey: 'unitName',
                id: 'unitName',
                render: renderUnitName,
            },
            {
                header: AddedDateMessage,
                dataKey: 'createdAt',
                id: 'createdAt',
                render: renderDate,
            },
            {
                header: PhoneMessage,
                dataKey: 'phone',
                id: 'phone',
                render: renderPhone,
            },
            {
                header: IsVerifiedMessage,
                dataKey: 'isVerified',
                id: 'isVerified',
                render: renderIsVerified,
            },
            {
                header: UnitTypeMessage,
                dataKey: 'unitType',
                id: 'unitType',
                render: renderUnitType,
            },
            {
                header: EmailMessage,
                dataKey: 'email',
                id: 'email',
                render: renderEmail,
            },
            {
                header: OwnershipPercentageMessage,
                dataKey: 'ownershipPercentage',
                id: 'ownershipPercentage',
                render: renderOwnershipPercentage,
            },
            {
                header: NoteMessage,
                dataKey: 'note',
                id: 'note',
                render: renderNote,
            },
            {
                header: CommunityFeeMessage,
                dataKey: 'communityFee',
                id: 'communityFee',
                render: renderCommunityFee,
            },
        ]
    }, [
        NameMessage, 
        AddressMessage, 
        RoleMessage, 
        UnitMessage, 
        AddedDateMessage, 
        PhoneMessage, 
        IsVerifiedMessage, 
        UnitTypeMessage, 
        EmailMessage, 
        OwnershipPercentageMessage, 
        NoteMessage, 
        CommunityFeeMessage,
        renderRole,
        renderAddress, 
        renderUnitName, 
        renderUnitType,
        renderPhone,
        renderEmail,
        renderOwnershipPercentage,
        renderNote,
        renderCommunityFee,
        renderIsVerified,
        renderDate,
        renderCell,
        renderRolesFilterDropdown,
    ])
}
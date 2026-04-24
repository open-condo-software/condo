import { GetContactsForTableQuery } from '@app/condo/gql'
import { ContactWhereInput } from '@app/condo/schema'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { TableColumn, RenderTableCell } from '@open-condo/ui'

import {
    getAddressRender, 
    getDateRender,
    getTableCellRenderer,
    getUnitNameRender,
    getUnitTypeRender,
} from '@condo/domains/common/components/Table/Renders'
import { getFilterComponentByKey, TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'

type TData = GetContactsForTableQuery['contacts'][number]

type UseTableColumns = (
    filterMetas: Array<TableFiltersMeta<ContactWhereInput>>,
) => TableColumn<TData>[]
export const useTableColumns: UseTableColumns = (filterMetas) => {
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
    const NoteMessage = intl.formatMessage({ id: 'contact.column.header.note' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const NoMessage = intl.formatMessage({ id: 'No' })


    const renderName = useCallback<RenderTableCell<TData, TData['name']>>(
        (name, _, __, globalFilter) => getTableCellRenderer({ search: globalFilter, ellipsis: true })(name)
        , [])

    const renderAddress = useCallback<RenderTableCell<TData>>(
        (_, contact, __, globalFilter) => getAddressRender(contact?.property, DeletedMessage, globalFilter)
        , [DeletedMessage])

    const renderRole = useCallback<RenderTableCell<TData, TData['role']>>(
        (role, _, __, globalFilter) => getTableCellRenderer({ search: globalFilter, ellipsis: true })(role?.name ?? '—')
        , [])

    const renderUnitName = useCallback<RenderTableCell<TData, TData['unitName']>>(
        (text, contact, _, globalFilter) => getUnitNameRender<TData>(intl, text, contact, globalFilter)
        , [intl])

    const renderUnitType = useCallback<RenderTableCell<TData, TData['unitType']>>(
        (text, contact, _, globalFilter) => getUnitTypeRender<TData>(intl, text, contact, globalFilter)
        , [intl])

    const renderDate = useCallback<RenderTableCell<TData, TData['createdAt']>>(
        (date, _, __, globalFilter) => getDateRender(intl, globalFilter)(date)
        , [intl])

    const renderPhone = useCallback<RenderTableCell<TData, TData['phone']>>(
        (phone, contact, _, globalFilter) => getTableCellRenderer({ search: globalFilter, href: `tel:${contact?.organization?.phoneNumberPrefix ?? ''}${phone}` })(phone)
        , [])

    const renderIsVerified = useCallback<RenderTableCell<TData, TData['isVerified']>>(
        (isVerified, _, __, globalFilter) => getTableCellRenderer({ search: globalFilter, ellipsis: true })(isVerified ? YesMessage : NoMessage)
        , [NoMessage, YesMessage])

    const renderEmail = useCallback<RenderTableCell<TData, TData['email']>>(
        (email, _, __, globalFilter) => getTableCellRenderer({ search: globalFilter, href: email ? `mailto:${email}` : undefined, ellipsis: true })(email ?? '—')
        , [])

    const renderNote = useCallback<RenderTableCell<TData, TData['note']>>(
        (note, _, __, globalFilter) => getTableCellRenderer({ search: globalFilter, ellipsis: true })(note ?? '—')
        , [])


    return useMemo(() => {
        return [
            {
                header: NameMessage,
                dataKey: 'name',
                id: 'name',
                render: renderName,
                filterComponent: getFilterComponentByKey(filterMetas, 'name'),
                initialSize: '15%',
            },
            {
                header: AddressMessage,
                dataKey: 'property.address',
                id: 'address',
                enableSorting: false,
                render: renderAddress,
                filterComponent: getFilterComponentByKey(filterMetas, 'address'),
                initialSize: '20%',
            },
            {
                header: RoleMessage,
                dataKey: 'role',
                id: 'role',
                render: renderRole,
                filterComponent: getFilterComponentByKey(filterMetas, 'role'),
                initialSize: '10%',
            },
            {
                header: UnitMessage,
                dataKey: 'unitName',
                id: 'unitName',
                render: renderUnitName,
                filterComponent: getFilterComponentByKey(filterMetas, 'unitName'),
                initialSize: '10%',
            },
            {
                header: AddedDateMessage,
                dataKey: 'createdAt',
                id: 'createdAt',
                render: renderDate,
                filterComponent: getFilterComponentByKey(filterMetas, 'createdAt'),
                initialSize: '15%',
            },
            {
                header: PhoneMessage,
                dataKey: 'phone',
                id: 'phone',
                render: renderPhone,
                filterComponent: getFilterComponentByKey(filterMetas, 'phone'),
                initialSize: '10%',
            },
            {
                header: IsVerifiedMessage,
                dataKey: 'isVerified',
                id: 'isVerified',
                render: renderIsVerified,
                filterComponent: getFilterComponentByKey(filterMetas, 'isVerified'),
                minSize: 100,
            },
            {
                header: UnitTypeMessage,
                dataKey: 'unitType',
                id: 'unitType',
                render: renderUnitType,
                filterComponent: getFilterComponentByKey(filterMetas, 'unitType'),
                initialSize: '10%',
                initialVisibility: false,
            },
            {
                header: EmailMessage,
                dataKey: 'email',
                id: 'email',
                render: renderEmail,
                filterComponent: getFilterComponentByKey(filterMetas, 'email'),
                initialSize: '10%',
                initialVisibility: false,
            },
            {
                header: NoteMessage,
                dataKey: 'note',
                id: 'note',
                render: renderNote,
                filterComponent: getFilterComponentByKey(filterMetas, 'note'),
                initialSize: '10%',
                initialVisibility: false,
            },
        ]
    }, [
        filterMetas,
        NameMessage, 
        AddressMessage, 
        RoleMessage, 
        UnitMessage, 
        AddedDateMessage, 
        PhoneMessage, 
        IsVerifiedMessage, 
        UnitTypeMessage, 
        EmailMessage, 
        NoteMessage,
        renderName,
        renderRole,
        renderAddress, 
        renderUnitName, 
        renderUnitType,
        renderPhone,
        renderEmail,
        renderIsVerified,
        renderDate,
        renderNote,
    ])
}
import { GetContactsForTableQuery } from '@app/condo/gql'
import { 
    Contact, 
    ContactWhereInput, 
    ContactRole,
} from '@app/condo/schema'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { TableColumn } from '@open-condo/ui'

import {
    getAddressRender, 
    getDateRender,
    getTableCellRenderer,
    getUnitNameRender,
    getUnitTypeRender,
} from '@condo/domains/common/components/Table/Renders'
import { getFilterComponentByKey, OpenFiltersMeta } from '@condo/domains/common/utils/filters.utils'

type UseTableColumns = (
    filterMetas: Array<OpenFiltersMeta<ContactWhereInput>>,
    search?: string,
) => TableColumn<GetContactsForTableQuery['contacts'][number]>[]
export const useTableColumns: UseTableColumns = (filterMetas, search = '') => {
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
    const CommunityFeeMessage = intl.formatMessage({ id: 'contact.column.header.communityFee' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const NoMessage = intl.formatMessage({ id: 'No' })


    const renderCell = useMemo(
        () => getTableCellRenderer({ search, ellipsis: true }), 
        [search])

    const renderAddress = useCallback(
        (_, contact) => getAddressRender(contact?.property, DeletedMessage, search), 
        [search, DeletedMessage])

    const renderUnitName = useCallback(
        (text, contact) => getUnitNameRender<Contact>(intl, text, contact, search), 
        [search, intl])

    const renderUnitType = useCallback(
        (text, contact) => getUnitTypeRender<Contact>(intl, text, contact, search), 
        [search, intl])

    const renderRole = useCallback(
        (role: ContactRole) => renderCell(role?.name ?? '—'), 
        [renderCell])

    const renderDate = useCallback(
        (date) => getDateRender(intl, search)(date),
        [search, intl])

    const renderPhone = useCallback((phone, contact) => {
        const phonePrefix = contact?.organization?.phoneNumberPrefix

        return getTableCellRenderer({ search, href: `tel:${phonePrefix ? `${phonePrefix}${phone}` : `${phone}`}` })(phone)
    }, [search])

    const renderEmail = useCallback(
        (email) => getTableCellRenderer({ search, href: email ? `mailto:${email}` : undefined })(email ?? '—'), 
        [search])

    const renderIsVerified = useCallback(
        (isVerified) => renderCell(isVerified ? YesMessage : NoMessage), 
        [NoMessage, YesMessage, renderCell])

    const renderCommunityFee = useCallback(
        (communityFee) => renderCell(communityFee ?? '—'), 
        [renderCell])


    return useMemo(() => {
        return [
            {
                header: NameMessage,
                dataKey: 'name',
                id: 'name',
                render: renderCell,
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
                header: CommunityFeeMessage,
                dataKey: 'communityFee',
                id: 'communityFee',
                render: renderCommunityFee,
                filterComponent: getFilterComponentByKey(filterMetas, 'communityFee'),
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
        CommunityFeeMessage,
        renderRole,
        renderAddress, 
        renderUnitName, 
        renderUnitType,
        renderPhone,
        renderEmail,
        renderCommunityFee,
        renderIsVerified,
        renderDate,
        renderCell,
    ])
}
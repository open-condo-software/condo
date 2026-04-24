import { useGetCommonOrOrganizationContactRolesQuery } from '@app/condo/gql'
import { ContactWhereInput, ContactUnitTypeType } from '@app/condo/schema'
import { useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { ComponentType, convertToOptions, TableFiltersMeta } from '@condo/domains/common/utils/filters.utils'
import {
    getBooleanFilter,
    getDayRangeFilter,
    getFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { getUnitFilter } from '@condo/domains/property/utils/tables.utils'
import { searchOrganizationProperty } from '@condo/domains/ticket/utils/clientSchema/search'

const filterName = getStringContainsFilter('name')
const filterPhone = getStringContainsFilter('phone')
const filterEmail = getStringContainsFilter('email')
const filterUnitType = getFilter('unitType', 'array', 'string', 'in')
const filterAddressStringContains = getStringContainsFilter(['property', 'address'])
const filterAddress = getFilter(['property', 'id'], 'array', 'string', 'in')
const filterRole = getFilter(['role', 'id'], 'array', 'string', 'in')
const filterIsVerified = getBooleanFilter(['isVerified'])
const filterCreatedAtRange = getDayRangeFilter('createdAt')
const filterNote = getStringContainsFilter('note')

type UseContactsTableFilters = () => Array<TableFiltersMeta<ContactWhereInput>>

export const useContactsTableFilters: UseContactsTableFilters = () => {
    const intl = useIntl()
    const UserNameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'Email' })
    const EnterUnitNameLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })
    const EnterAddressMessage = intl.formatMessage({ id: 'pages.condo.meter.EnterAddress' })
    const StartDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.start' })
    const EndDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.end' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const NoMessage = intl.formatMessage({ id: 'No' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const NoteMessage = intl.formatMessage({ id: 'contact.column.header.note' })

    const { organization } = useOrganization()
    const organizationId = organization?.id || null

    const { persistor } = useCachePersistor()

    const { data: contactRolesData, loading: contactRolesLoading } = useGetCommonOrOrganizationContactRolesQuery({
        variables: {
            organizationId,
        },
        skip: !organizationId || !persistor,
    })

    const contactRoles = useMemo(() => contactRolesData?.roles?.filter(Boolean) || [], [contactRolesData?.roles])

    const contactRoleOptions = useMemo(() => convertToOptions(contactRoles, 'name', 'id'), [contactRoles])

    const filterUnit = useMemo(() => getUnitFilter(intl.messages), [intl])

    const unitTypeOptions = useMemo(() => (
        Object.values(ContactUnitTypeType)
            .map((unitType) => ({ 
                label: intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` }), 
                value: unitType,
            }))
    ), [intl])
    
    const isVerifiedOptions = useMemo(() => ([
        { label: YesMessage, value: 'true' },
        { label: NoMessage, value: 'false' },
    ]), [NoMessage, YesMessage])

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [
                    filterName,
                    filterPhone,
                    filterAddressStringContains,
                    filterCreatedAtRange,
                    filterUnit,
                ],
                combineType: 'OR',
            },
            {
                keyword: 'name',
                filters: [filterName],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: UserNameMessage,
                    },
                },
            },
            {
                keyword: 'address',
                filters: [filterAddress],
                component: {
                    type: ComponentType.GQLSelect,
                    props: {
                        search: searchOrganizationProperty(organizationId),
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: EnterAddressMessage,
                        infinityScroll: true,
                    },
                },
            },
            {
                keyword: 'unitName',
                filters: [filterUnit],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: EnterUnitNameLabel,
                    },
                },
            },
            {
                keyword: 'unitType',
                filters: [filterUnitType],
                component: {
                    type: ComponentType.CheckboxGroup,
                    options: unitTypeOptions,
                },
            },
            {
                keyword: 'createdAt',
                filters: [filterCreatedAtRange],
                component: {
                    type: ComponentType.DateRange,
                    props: {
                        placeholder: [StartDateMessage, EndDateMessage],
                    },
                },
            },
            {
                keyword: 'phone',
                filters: [filterPhone],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: PhoneMessage,
                    },
                },
            },
            {
                keyword: 'email',
                filters: [filterEmail],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: EmailMessage,
                    },
                },
            },
            {
                keyword: 'role',
                filters: [filterRole],
                component: {
                    type: ComponentType.CheckboxGroup,
                    options: contactRoleOptions,
                    props: {
                        disabled: contactRolesLoading,
                    },
                },
            },
            {
                keyword: 'isVerified',
                filters: [filterIsVerified],
                component: {
                    type: ComponentType.Select,
                    options: isVerifiedOptions,
                    props: {
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                },
            },
            {
                keyword: 'note',
                filters: [filterNote],
                component: {
                    type: ComponentType.Input,
                    props: {
                        placeholder: NoteMessage,
                    },
                },
            },
        ]
    }, [
        EnterAddressMessage,
        contactRoleOptions,
        EndDateMessage, 
        EnterUnitNameLabel, 
        EmailMessage,
        PhoneMessage, 
        SelectMessage, 
        StartDateMessage,
        isVerifiedOptions,
        UserNameMessage, 
        filterUnit,
        organizationId,
        unitTypeOptions,
        contactRolesLoading,
        NoteMessage,
    ])
}

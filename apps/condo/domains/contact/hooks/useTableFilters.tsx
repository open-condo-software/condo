import { ContactWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import {
    getBooleanFilter,
    getDayRangeFilter,
    getFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'
import { getUnitFilter } from '@condo/domains/property/utils/tables.utils'


const filterName = getStringContainsFilter('name')
const filterPhone = getStringContainsFilter('phone')
const filterAddress = getStringContainsFilter(['property', 'address'])
const filterRole = getFilter(['role', 'id'], 'array', 'string', 'in')
const filterIsVerified = getBooleanFilter(['isVerified'])
const filterCreatedAtRange = getDayRangeFilter('createdAt')

type UseContactsTableFilters = () => Array<FiltersMeta<ContactWhereInput>>

export const useContactsTableFilters: UseContactsTableFilters = () => {
    const intl = useIntl()
    const UserNameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EnterUnitNameLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })
    const StartDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.start' })
    const EndDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.end' })
    const YesMessage = intl.formatMessage({ id: 'Yes' })
    const NoMessage = intl.formatMessage({ id: 'No' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })

    const filterUnit = useMemo(() => getUnitFilter(intl.messages), [intl])
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
                    filterAddress,
                    filterCreatedAtRange,
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
                    type: ComponentType.Input,
                    props: {
                        placeholder: AddressMessage,
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
                keyword: 'role',
                filters: [filterRole],
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
        ]
    }, [
        AddressMessage, EndDateMessage, EnterUnitNameLabel, PhoneMessage, SelectMessage, StartDateMessage,
        UserNameMessage, filterUnit, isVerifiedOptions,
    ])
}

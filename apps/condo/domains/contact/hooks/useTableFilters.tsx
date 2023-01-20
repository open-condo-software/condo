import { MeterReadingWhereInput } from '@app/condo/schema'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import {
    ComponentType,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import {
    getFilter,
    getStringContainsFilter,
} from '@condo/domains/common/utils/tables.utils'

const filterName = getStringContainsFilter('name')
const filterPhone = getStringContainsFilter('phone')
const filterEmail = getStringContainsFilter('email')
const filterAddress = getStringContainsFilter(['property', 'address'])
const filterUnit = getFilter('unitName', 'array', 'string', 'in')

export function useContactsTableFilters (): Array<FiltersMeta<MeterReadingWhereInput>>  {
    const intl = useIntl()
    const UserNameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const EnterUnitNameLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })

    return useMemo(() => {
        return [
            {
                keyword: 'search',
                filters: [
                    filterName,
                    filterPhone,
                    filterAddress,
                    filterEmail,
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
        ]
    }, [AddressMessage, EmailMessage, PhoneMessage, UserNameMessage])
}
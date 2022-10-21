import { useMemo } from 'react'
import { useIntl } from '@condo/next/intl'

import {
    ComponentType, FilterComponentSize,
    FiltersMeta,
} from '@condo/domains/common/utils/filters.utils'
import { MeterReadingWhereInput } from '@app/condo/schema'
import {
    getFilter,
    getStringContainsFilter, OptionType,
} from '@condo/domains/common/utils/tables.utils'
import { getContactAttributesFilter } from '@condo/domains/contact/utils/contactTableUtils'

const filterName = getStringContainsFilter('name')
const filterPhone = getStringContainsFilter('phone')
const filterEmail = getStringContainsFilter('email')
const filterAddress = getStringContainsFilter(['property', 'address'])
const filterUnit = getFilter('unitName', 'array', 'string', 'in')
const filterVerified = getContactAttributesFilter(['isVerified', 'isVerified_not'])
const filterAttribute = getContactAttributesFilter(['isVerified'])

export function useContactsTableFilters (): Array<FiltersMeta<MeterReadingWhereInput>>  {
    const intl = useIntl()
    const UserNameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const EnterUnitNameLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.EnterUnitName' })
    const SelectMessage = intl.formatMessage({ id: 'Select' })
    const VerifiedMessage = intl.formatMessage({ id: 'pages.condo.contact.Verified' })
    const NotVerifiedMessage = intl.formatMessage({ id: 'pages.condo.contact.NotVerified' })
    const AttributeLabel = intl.formatMessage({ id: 'pages.condo.ticket.filters.Attribute' })

    const verifiedOptions: OptionType[] = useMemo(() => [
        { label: VerifiedMessage, value: 'isVerified' },
        { label: NotVerifiedMessage, value: 'isVerified_not' },
    ], [VerifiedMessage])

    const attributeOptions: OptionType[] = useMemo(() => [
        { label: VerifiedMessage, value: 'isVerified' },
    ], [VerifiedMessage])


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
            {
                keyword: 'isVerified',
                filters: [filterVerified],
                component: {
                    type: ComponentType.Select,
                    options: verifiedOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: AttributeLabel,
                        size: FilterComponentSize.Small,
                        spaceSizeAfter: FilterComponentSize.Small,
                    },
                },
            },
            {
                keyword: 'attributes',
                filters: [filterAttribute],
                component: {
                    type: ComponentType.Select,
                    options: attributeOptions,
                    props: {
                        mode: 'multiple',
                        showArrow: true,
                        placeholder: SelectMessage,
                    },
                    modalFilterComponentWrapper: {
                        label: AttributeLabel,
                        size: FilterComponentSize.Small,
                        spaceSizeAfter: FilterComponentSize.Small,
                    },
                },
            },
        ]
    }, [AddressMessage, EmailMessage, PhoneMessage, UserNameMessage, SelectMessage])
}
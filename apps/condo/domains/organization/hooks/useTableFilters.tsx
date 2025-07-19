import { PropertyWhereInput } from '@app/condo/schema'

import { useIntl } from '@open-condo/next/intl'

import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getStringContainsFilter, getFilter } from '@condo/domains/common/utils/tables.utils'

const filterName = getStringContainsFilter('name')
const filterEmail = getStringContainsFilter('email')
const filterPhone = getStringContainsFilter('phone')
const filterPosition = getStringContainsFilter('position')
const filterRole = getFilter(['role', 'id'], 'array', 'string', 'in')

export const useTableFilters = () => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'Email' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })

    const propertyFilterMetas: FiltersMeta<PropertyWhereInput>[] = [
        {
            keyword: 'search',
            filters: [filterName, filterPhone, filterEmail, filterPosition],
            combineType: 'OR',
        },
        {
            keyword: 'name',
            filters: [filterName],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: NameMessage,
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
            keyword: 'position',
            filters: [filterPosition],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: PositionMessage,
                },
            },
        },
        {
            keyword: 'role',
            filters: [filterRole],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: RoleMessage,
                },
            },
        },
    ]

    return propertyFilterMetas
}
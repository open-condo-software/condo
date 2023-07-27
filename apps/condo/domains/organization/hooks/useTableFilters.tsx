import { PropertyWhereInput } from '@app/condo/schema'

import { useIntl } from '@open-condo/next/intl'

import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getStringContainsFilter, getFilter } from '@condo/domains/common/utils/tables.utils'

const filterName = getStringContainsFilter('name')
const filterPhone = getStringContainsFilter('phone')
const filterPosition = getStringContainsFilter('position')
const filterRole = getFilter(['role', 'id'], 'array', 'string', 'in')

export const useTableFilters = () => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.fullName.short' })
    const PhoneMessage = intl.formatMessage({ id: 'phone' })
    const PositionMessage = intl.formatMessage({ id: 'employee.position' })
    const RoleMessage = intl.formatMessage({ id: 'employee.role' })

    const propertyFilterMetas: FiltersMeta<PropertyWhereInput>[] = [
        {
            keyword: 'search',
            filters: [filterName, filterPhone, filterPosition],
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
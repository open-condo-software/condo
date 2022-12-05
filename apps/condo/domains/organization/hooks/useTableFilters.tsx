import { PropertyWhereInput } from '@app/condo/schema'
import { useIntl } from '@open-condo/next/intl'

import { getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'

const filterName = getStringContainsFilter('name')
const filterPhone = getStringContainsFilter('phone')
const filterPosition = getStringContainsFilter('position')
const filterRole = getStringContainsFilter(['role', 'name'])

export const useTableFilters = () => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'field.FullName.short' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })

    const propertyFilterMetas: FiltersMeta<PropertyWhereInput>[] = [
        {
            keyword: 'search',
            filters: [filterName, filterPhone, filterPosition, filterRole],
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
import { getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'
import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { DivisionWhereInput } from '@app/condo/schema'
import { useIntl } from '@open-condo/next/intl'

const filterName = getStringContainsFilter('name')
const filterProperties = (search: string) => {
    if (!search) return

    return {
        properties_some: {
            OR: [
                {
                    address_contains_i: search,
                },
                {
                    name_contains_i: search,
                },
            ],
        },
    }
}
const filterResponsible = (search: string) => {
    if (!search) return

    return {
        responsible: {
            name_contains_i: search,
        },
    }
}
const filterExecutors = (search: string) => {
    if (!search) return

    return {
        executors_some: {
            name_contains_i: search,
        },
    }
}

export const useTableFilters = () => {
    const intl = useIntl()
    const DivisionTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Division' })

    const divisionFilterMetas: FiltersMeta<DivisionWhereInput>[] = [
        {
            keyword: 'name',
            filters: [filterName],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: DivisionTitleMessage,
                },
            },
        },
        {
            keyword: 'search',
            filters: [
                filterName,
                filterProperties,
                filterResponsible,
                filterExecutors,
            ],
            combineType: 'OR',
        },
    ]

    return divisionFilterMetas
}
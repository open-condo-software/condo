import { getFilter } from '@condo/domains/common/utils/tables.utils'
import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { DivisionWhereInput } from '@app/condo/schema'
import { useIntl } from '@core/next/intl'

export const useTableFilters = () => {
    const intl = useIntl()
    const DivisionTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Division' })

    const nameFilter = getFilter('name', 'single', 'string', 'contains_i')
    const propertiesFilter = (search: string) => ({
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
    })
    const responsibleFilter = (search: string) => ({
        responsible: {
            name_contains_i: search,
        },
    })
    const executorsFilter = (search: string) => ({
        executors_some: {
            name_contains_i: search,
        },
    })

    const divisionFilterMetas: FiltersMeta<DivisionWhereInput>[] = [
        {
            keyword: 'name',
            filters: [nameFilter],
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
                nameFilter,
                propertiesFilter,
                responsibleFilter,
                executorsFilter,
            ],
            combineType: 'OR',
        },
    ]

    return divisionFilterMetas
}
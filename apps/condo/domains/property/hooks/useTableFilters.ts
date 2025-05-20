import { PropertyWhereInput } from '@app/condo/schema'

import { useIntl } from '@open-condo/next/intl'

import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getDayRangeFilter, getFilter } from '@condo/domains/common/utils/tables.utils'

const addressFilter = getFilter('address', 'single', 'string', 'contains_i')
const unitsCountFilter = getFilter('unitsCount', 'single', 'number')
const filterCreatedAtRange = getDayRangeFilter('createdAt')

export const useTableFilters = () => {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Address' })
    const StartDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.start' })
    const EndDateMessage = intl.formatMessage({ id: 'global.filters.dateRange.end' })

    const propertyFilterMetas: FiltersMeta<PropertyWhereInput>[] = [
        {
            keyword: 'address',
            filters: [addressFilter],
            component: {
                type: ComponentType.Input,
                props: {
                    placeholder: AddressMessage,
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
        { keyword: 'search', filters: [addressFilter, filterCreatedAtRange, unitsCountFilter], combineType: 'OR' },
    ]

    return propertyFilterMetas
}
import { PropertyWhereInput } from '@app/condo/schema'

import { useIntl } from '@open-condo/next/intl'

import { ComponentType, FiltersMeta } from '@condo/domains/common/utils/filters.utils'
import { getFilter } from '@condo/domains/common/utils/tables.utils'


export const useTableFilters = () => {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Address' })

    const addressFilter = getFilter('address', 'single', 'string', 'contains_i')
    const unitsCountFilter = getFilter('unitsCount', 'single', 'number')
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
        { keyword: 'search', filters: [addressFilter, unitsCountFilter], combineType: 'OR' },
    ]

    return propertyFilterMetas
}
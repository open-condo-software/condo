import { useIntl } from '@open-condo/next/intl'

import { getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilter, getStringContainsFilter } from '@condo/domains/common/utils/tables.utils'


const filterName = getStringContainsFilter(['name'])
const filterCategory = getFilter(['category', 'id'], 'array', 'string', 'in')

export const usePropertyDocumentsTableFilters = () => {
    return [
        {
            keyword: 'search',
            filters: [filterName],
        },
        {
            keyword: 'category',
            filters: [filterCategory],
        },
    ]
}
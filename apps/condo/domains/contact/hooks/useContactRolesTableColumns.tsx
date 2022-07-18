import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { useMemo } from 'react'

export function useContactRolesTableColumns<T> (filterMetas: Array<FiltersMeta<T>>): Array<Record<string, unknown>> {
    const intl = useIntl()
    const nameMessage = intl.formatMessage({ id: 'ContactRoles.name' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)

    return useMemo(() => {
        return [
            {
                title: nameMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                filterIcon: getFilterIcon,
                ellipsis: true,
            },
        ]
    }, [nameMessage, filters, filterMetas])
}

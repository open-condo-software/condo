import { TableRecord } from '@condo/domains/common/components/Table/Index'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { IFilters } from '@condo/domains/contact/utils/helpers'
import { useIntl } from '@core/next/intl'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { IntlShape } from 'react-intl/src/types'

const getTypeRenderer = (intl: IntlShape) => (organization, record: TableRecord) => {
    const DefaultType = intl.formatMessage({ id: 'ContactRoles.types.default' })
    const CustomType = intl.formatMessage({ id: 'ContactRoles.types.custom' })
    return organization ? CustomType : DefaultType
}

export function useContactRolesTableColumns<T> (filterMetas: Array<FiltersMeta<T>>): Array<Record<string, unknown>> {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'ContactRoles.name' })
    const TypeMessage = intl.formatMessage({ id: 'ContactRoles.type' })

    const router = useRouter()
    const { filters } = parseQuery(router.query)

    return useMemo(() => {
        return [
            {
                title: NameMessage,
                filteredValue: getFilteredValue<IFilters>(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                filterIcon: getFilterIcon,
                ellipsis: true,
            },
            {
                title: TypeMessage,
                dataIndex: 'organization',
                key: 'type',
                render: getTypeRenderer(intl),
            },
        ]
    }, [NameMessage, filters, filterMetas])
}

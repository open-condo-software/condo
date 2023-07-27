import { PropertyWhereInput } from '@app/condo/schema'
import { FilterValue } from 'antd/es/table/interface'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'


import { getAddressRender } from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

export interface ITableColumn {
    title: string,
    ellipsis?: boolean,
    sortOrder?: string,
    filteredValue?: FilterValue,
    dataIndex?: string,
    key?: string,
    sorter?: boolean,
    width?: string,
    filterDropdown?: unknown,
    filterIcon?: unknown
}

export const useTableColumns = (filterMetas: FiltersMeta<PropertyWhereInput>[]) => {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'property.index.tableField.address' })
    const UnitsCountMessage = intl.formatMessage({ id: 'property.index.tableField.unitsCount' })
    const UninhabitedUnitsCountMessage = intl.formatMessage({ id: 'property.index.tableField.uninhabitedUnitsCount' })
    const TasksInWorkMessage = intl.formatMessage({ id: 'property.index.tableField.tasksInWorkCount' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const search = getFilteredValue(filters, 'search')

    const renderAddress = useCallback((_, property) => {
        return getAddressRender(property, null, search)
    }, [search])

    return useMemo(() => {
        return [
            {
                title: AddressMessage,
                ellipsis: true,
                dataIndex: 'address',
                key: 'address',
                sorter: true,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                render: renderAddress,
                width: '55%',
            },
            {
                title: UnitsCountMessage,
                ellipsis: true,
                dataIndex: 'unitsCount',
                key: 'unitsCount',
                width: '15%',
            },
            {
                title: UninhabitedUnitsCountMessage,
                ellipsis: true,
                dataIndex: 'uninhabitedUnitsCount',
                key: 'uninhabitedUnitsCount',
                width: '15%',
            },
            {
                title: TasksInWorkMessage,
                ellipsis: true,
                dataIndex: 'ticketsInWork',
                key: 'ticketsInWork',
                width: '15%',
            },
        ]
    }, [
        filters,
        sorters,
    ])
}

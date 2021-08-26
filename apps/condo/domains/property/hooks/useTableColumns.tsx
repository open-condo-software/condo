import { FilterValue } from 'antd/es/table/interface'

import { useMemo } from 'react'
import { useIntl } from '@core/next/intl'


import { convertColumns, FiltersFromQueryType, Sorters } from '@condo/domains/common/utils/tables.utils'

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

export const useTableColumns = (sorters: Sorters, filters: FiltersFromQueryType) => {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Address' })
    const UnitsCountMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.UnitsCount' })
    const TasksInWorkMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.TasksInWorkCount' })

    return useMemo(() =>
        convertColumns([
            {
                title: AddressMessage,
                ellipsis: true,
                dataIndex: 'address',
                key: 'address',
                sortable: true,
                width: 50,
                filter: {
                    type: 'string',
                },
            },
            {
                title: UnitsCountMessage,
                ellipsis: true,
                dataIndex: 'unitsCount',
                key: 'unitsCount',
                width: 25,
            },
            {
                title: TasksInWorkMessage,
                ellipsis: true,
                dataIndex: 'ticketsInWork',
                key: 'ticketsInWork',
                width: 25,
            },
        ], filters, sorters),
        [filters, sorters])
}

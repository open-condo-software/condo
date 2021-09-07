import { FilterValue } from 'antd/es/table/interface'

import { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { FiltersFromQueryType, Sorters } from '@condo/domains/common/utils/tables.utils'
import { getTextFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { get } from 'lodash'
import { getTextRender } from '@condo/domains/common/components/Table/Renders'

export interface ITableColumn {
    title: string
    ellipsis?: boolean
    sortOrder?: string
    filteredValue?: FilterValue
    dataIndex?: string
    key?: string
    sorter?: boolean
    width?: string
    filterDropdown?: unknown
    filterIcon?: unknown
}

export const useTableColumns = (sorters: Sorters, filters: FiltersFromQueryType) => {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Address' })
    const UnitsCountMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.UnitsCount' })
    const TasksInWorkMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.TasksInWorkCount' })

    return useMemo(() => {
        const search = get(filters, 'name')
        const columns = [
            {
                title: AddressMessage,
                ellipsis: true,
                dataIndex: 'address',
                key: 'address',
                sorter: true,
                width: '50%',
                filterDropdown: getTextFilterDropdown(AddressMessage),
                render: !Array.isArray(search) ? getTextRender(search) : undefined,
            },
            {
                title: UnitsCountMessage,
                ellipsis: true,
                dataIndex: 'unitsCount',
                key: 'unitsCount',
                width: '25%',
            },
            {
                title: TasksInWorkMessage,
                ellipsis: true,
                dataIndex: 'ticketsInWork',
                key: 'ticketsInWork',
                width: 25,
            },
        ]
        return columns
    }, [filters, sorters])
}

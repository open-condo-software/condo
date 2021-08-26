
import { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { FilterValue } from 'antd/es/table/interface'

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
    const DivisionTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Division' })
    const BuildingsTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
    const ForemanTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Foreman' })
    const TechiesTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Techies' })

    return useMemo(() =>
        convertColumns([
            {
                title: DivisionTitleMessage,
                ellipsis: true,
                dataIndex: 'address',
                key: 'address',
                sortable: true,
                width: 25,
                filter: {
                    type: 'string',
                },
            },
            {
                title: BuildingsTitleMessage,
                ellipsis: true,
                dataIndex: 'properties',
                key: 'properties',
                width: 25,
            },
            {
                title: ForemanTitleMessage,
                ellipsis: true,
                dataIndex: 'responsible',
                key: 'responsible',
                width: 25,
            },
            {
                title: TechiesTitleMessage,
                ellipsis: true,
                dataIndex: 'executors',
                key: 'executors',
                width: 25,
            },
        ], filters, sorters),
        [filters, sorters])
}
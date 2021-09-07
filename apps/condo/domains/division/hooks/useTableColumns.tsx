import { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { ColumnType, FilterValue } from 'antd/es/table/interface'

import { FiltersFromQueryType, Sorters } from '@condo/domains/common/utils/tables.utils'
import { get, isEmpty } from 'lodash'
import { EmptyTableCell } from '@condo/domains/common/components/Table/EmptyTableCell'
import { Typography } from 'antd'
import { Highliter } from '@condo/domains/common/components/Highliter'
import { colors } from '@condo/domains/common/constants/style'
import { Division } from '../utils/clientSchema'
import { getFilterValue, getTextFilterDropdown } from '@condo/domains/common/components/Table/Filters'
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
    const DivisionTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Division' })
    const BuildingsTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
    const ForemanTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Foreman' })
    const TechniciansTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Technicians' })
    const { search } = filters
    const render = (text, isArray = false) => {
        let result = text
        if (!isEmpty(search) && text) {
            result = (
                <Highliter
                    text={String(text)}
                    search={String(search)}
                    renderPart={(part) => <Typography.Text style={{ backgroundColor: colors.markColor }}>{part}</Typography.Text>}
                />
            )
        }
        return (
            <EmptyTableCell>
                {result}
                {isArray && <br />}
            </EmptyTableCell>
        )
    }
    return useMemo(() => {
        type ColumnTypes = [
            ColumnType<string>,
            ColumnType<Division.IDivisionUIState['properties']>,
            ColumnType<Division.IDivisionUIState['responsible']>,
            ColumnType<Division.IDivisionUIState['executors']>,
        ]
        const search = get(filters, 'search')
        const columns: ColumnTypes = [
            {
                title: DivisionTitleMessage,
                ellipsis: true,
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                filterDropdown: getTextFilterDropdown(DivisionTitleMessage),
                filteredValue: getFilterValue('name', filters),
                width: '25%',
                render: !Array.isArray(search) ? getTextRender(search) : undefined,
                sortOrder: get(sorters, 'name'),
            },
            {
                title: BuildingsTitleMessage,
                ellipsis: true,
                dataIndex: 'properties',
                key: 'properties',
                render: (properties) => properties.map((property) => render(property.address, true)),
                width: '35%',
            },
            {
                title: ForemanTitleMessage,
                ellipsis: true,
                dataIndex: 'responsible',
                key: 'responsible',
                render: (responsible) => render(responsible.name),
                width: '20%',
            },
            {
                title: TechniciansTitleMessage,
                ellipsis: true,
                dataIndex: 'executors',
                render: (executors) => executors.map((executor) => render(executor.name, true)),
                key: 'executors',
                width: '20%',
            },
        ]
        return columns
    }, [filters, sorters, render])
}

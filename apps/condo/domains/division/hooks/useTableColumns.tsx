
import { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { FilterValue } from 'antd/es/table/interface'

import { ColumnInfo, convertColumns, FiltersFromQueryType, Sorters } from '@condo/domains/common/utils/tables.utils'
import { isEmpty } from 'lodash'
import { EmptyTableCell } from '@condo/domains/common/components/Table/EmptyTableCell'
import { Typography } from 'antd'
import { Highliter } from '@condo/domains/common/components/Highliter'
import { colors } from '@condo/domains/common/constants/style'
import { Division } from '../utils/clientSchema'

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
    const { search } = filters
    const render = (text, isArray = false) => {
        let result = text
        if (!isEmpty(search) && text) {
            result = (
                <Highliter
                    text={String(text)}
                    search={String(search)}
                    renderPart={(part) => (
                        <Typography.Text style={{ backgroundColor: colors.markColor }}>
                            {part}
                        </Typography.Text>
                    )}
                />
            )
        }
        return (<EmptyTableCell>{result}{isArray && <br />}</EmptyTableCell>)
    }
    return useMemo(() => {
        type ColumnTypes = [
            ColumnInfo<string>,
            ColumnInfo<Division.IDivisionUIState['properties']>,
            ColumnInfo<Division.IDivisionUIState['responsible']>,
            ColumnInfo<Division.IDivisionUIState['executors']>,
        ]
        const columns: ColumnTypes = [
            {
                title: DivisionTitleMessage,
                ellipsis: true,
                dataIndex: 'name',
                key: 'name',
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
                render: (properties) => properties.map((property) => render(property.address, true)),
                width: 35,
            },
            {
                title: ForemanTitleMessage,
                ellipsis: true,
                dataIndex: 'responsible',
                key: 'responsible',
                render: (responsible) => render(responsible.name),

                width: 20,
            },
            {
                title: TechiesTitleMessage,
                ellipsis: true,
                dataIndex: 'executors',
                render: (executors) => executors.map((executor) => render(executor.name, true)),
                key: 'executors',
                width: 20,
            },
        ]
        return convertColumns(columns, filters, sorters)
    }, [filters, sorters, render])
}
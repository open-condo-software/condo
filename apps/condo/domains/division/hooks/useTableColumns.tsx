import { colors } from '@condo/domains/common/constants/style'
import { ColumnsType, FilterValue } from 'antd/es/table/interface'

import React, { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

// import { createSorterMap, IFilters } from '../utils/helpers'
import get from 'lodash/get'

import { Typography } from 'antd'
import { isEmpty } from 'lodash'
import { Highliter } from '@condo/domains/common/components/Highliter'
import { getTextFilterDropdown, getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { EmptyTableCell } from '@condo/domains/common/components/EmptyTableCell'

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

const getFilteredValue = (filters: any, key: string | Array<string>): FilterValue => get(filters, key, null)

export const useTableColumns = (sort: Array<string>, filters: any,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>): Array<ITableColumn> => {
    const intl = useIntl()
    const columns = useMemo(() => {
        const DivisionTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Division' })
        const BuildingsTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
        const ForemanTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Foreman' })
        const TechiesTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Techies' })
        // const sorterMap = createSorterMap(sort)
        const search = getFilteredValue(filters, 'search')
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
        return [
            {
                title: DivisionTitleMessage,
                ellipsis: true,
                // sortOrder: get(sorterMap, 'address'),
                // filteredValue: getFilteredValue(filters, 'address'),
                dataIndex: 'name',
                key: 'name',
                width: '25%',
            },
            {
                title: BuildingsTitleMessage,
                ellipsis: true,
                dataIndex: 'properties',
                key: 'properties',
                render: properties => properties.map((property) => render(property.address, true)),
                width: '25%',
            },
            {
                title: ForemanTitleMessage,
                ellipsis: true,
                dataIndex: 'responsible',
                key: 'responsible',
                render: responsible => render(responsible.name),
                width: '25%',
            },
            {
                title: TechiesTitleMessage,
                ellipsis: true,
                dataIndex: 'executors',
                key: 'executors',
                render: executors => executors.map((executor) => render(executor.name, true)),
                width: '25%',
            },
        ] as ColumnsType<any>
    }, [sort, filters, intl])

    return columns
}

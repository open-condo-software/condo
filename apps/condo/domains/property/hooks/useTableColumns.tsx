import { colors } from '@condo/domains/common/constants/style'
import { FilterValue } from 'antd/es/table/interface'

import React, { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { createSorterMap, IFilters } from '../utils/helpers'
import get from 'lodash/get'

import { Typography } from 'antd'
import { isEmpty } from 'lodash'
import { Highliter } from '@condo/domains/common/components/Highliter'
import { getTextFilterDropdown, getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { EmptyTableCell } from '@condo/domains/common/components/EmptyTableCell'

interface ITableColumn {
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

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

export const useTableColumns = (sort: Array<string>, filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>): Array<ITableColumn> => {
    const intl = useIntl()
    const columns = useMemo(() => {
        const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Address' })
        const UnitsCountMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.UnitsCount' })
        const TasksInWorkMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.TasksInWorkCount' })
        const sorterMap = createSorterMap(sort)
        const search = getFilteredValue(filters, 'search')
        const render = (text) => {
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
            return (<EmptyTableCell>{result}</EmptyTableCell>)
        }
        return [
            {
                title: AddressMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                dataIndex: 'address',
                key: 'address',
                sorter: true,
                width: '50%',
                render,
                filterDropdown: getTextFilterDropdown(AddressMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
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
                width: '25%',
            },
        ]
    }, [sort, filters, intl])

    return columns
}

import React, { useCallback, useMemo } from 'react'
import isEmpty from 'lodash/isEmpty'
import { ColumnType, FilterValue } from 'antd/es/table/interface'
import { useRouter } from 'next/router'

import { useIntl } from '@core/next/intl'
import { DivisionWhereInput, Division as DivisionType } from '@app/condo/schema'

import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { EmptyTableCell } from '@condo/domains/common/components/Table/EmptyTableCell'
import {
    renderHighlightedPart,
} from '@condo/domains/common/components/Table/Renders'
import { TextHighlighter } from '@condo/domains/common/components/TextHighlighter'
import { getTextRender } from '@condo/domains/common/components/Table/Renders'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'

import { getAddressRender } from '../utils/clientSchema/Renders'

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

export const useTableColumns = (filterMetas: FiltersMeta<DivisionWhereInput>[]) => {
    const intl = useIntl()
    const DivisionTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Division' })
    const BuildingsTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
    const ForemanTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Foreman' })
    const TechniciansTitleMessage  = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Technicians' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const search = getFilteredValue(filters, 'search')

    const renderAddress = useCallback(
        (properties) => properties.map((property) => getAddressRender(property, DeletedMessage, search)),
        [search])

    return useMemo(() => {
        type ColumnTypes = [
            ColumnType<string>,
            ColumnType<DivisionType['properties']>,
            ColumnType<DivisionType['responsible']>,
            ColumnType<DivisionType['executors']>,
        ]

        const render = (text, isArray = false) => {
            let result = text

            if (!isEmpty(search) && text) {
                result = (
                    <TextHighlighter
                        text={String(text)}
                        search={String(search)}
                        renderPart={renderHighlightedPart}
                    />
                )
            }

            return (<EmptyTableCell>{result}{isArray && <br />}</EmptyTableCell>)
        }

        const columns: ColumnTypes = [
            {
                title: DivisionTitleMessage,
                ellipsis: true,
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'name'),
                width: '25%',
                render: !Array.isArray(search) ? getTextRender(search) : undefined,
            },
            {
                title: BuildingsTitleMessage,
                ellipsis: true,
                dataIndex: 'properties',
                key: 'properties',
                render: renderAddress,
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
    }, [filters, sorters])
}
import React, { useCallback, useMemo } from 'react'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { ColumnType, FilterValue } from 'antd/es/table/interface'
import { useRouter } from 'next/router'
import { TextProps } from 'antd/es/typography/Text'

import { useIntl } from '@core/next/intl'
import { DivisionWhereInput, Property } from '@app/condo/schema'

import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { EmptyTableCell } from '@condo/domains/common/components/Table/EmptyTableCell'
import {
    getTableCellRenderer,
    renderHighlightedPart,
} from '@condo/domains/common/components/Table/Renders'
import { TextHighlighter, TTextHighlighterProps } from '@condo/domains/common/components/TextHighlighter'
import { getTextRender } from '@condo/domains/common/components/Table/Renders'
import { getAddressDetailsWithoutUnit, getFilteredValue } from '@condo/domains/common/utils/helpers'

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

const ADDRESS_RENDER_POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const useTableColumns = (filterMetas: FiltersMeta<DivisionWhereInput>[]) => {
    const intl = useIntl()
    const DivisionTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Division' })
    const BuildingsTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Buildings' })
    const ForemanTitleMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Foreman' })
    const TechniciansTitleMessage  = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Technicians' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const search = getFilteredValue(filters, 'search')

    const getAddressRender = useCallback((property: Property, DeletedMessage?: string, search?: FilterValue | string) => {
        const isDeleted = !!get(property, 'deletedAt')
        const { streetLine, regionLine, cityLine } = getAddressDetailsWithoutUnit(property)
        const extraProps: Partial<TTextHighlighterProps> = isDeleted && { type: 'secondary' }
        const text = `${streetLine},`
        const deletedMessage = isDeleted && DeletedMessage ? `(${DeletedMessage})\n` : '\n'
        const postfix = `${regionLine}, ${cityLine} ${deletedMessage}`

        return getTableCellRenderer(search, false, postfix, extraProps, ADDRESS_RENDER_POSTFIX_PROPS)(text)
    }, [])

    const renderAddress = useCallback(
        (properties) => properties.map((property) => getAddressRender(property, null, search)),
        [search, getAddressRender])

    return useMemo(() => {
        type ColumnTypes = [
            ColumnType<string>,
            ColumnType<Division.IDivisionUIState['properties']>,
            ColumnType<Division.IDivisionUIState['responsible']>,
            ColumnType<Division.IDivisionUIState['executors']>,
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
import { useCallback, useMemo } from 'react'
import get from 'lodash/get'
import { FilterValue } from 'antd/es/table/interface'
import { useRouter } from 'next/router'

import { useIntl } from '@core/next/intl'

import { PropertyWhereInput } from '@app/condo/schema'

import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getAddressRender } from '@condo/domains/common/components/Table/Renders'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'

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
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Address' })
    const UnitsCountMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.UnitsCount' })
    const TasksInWorkMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.TasksInWorkCount' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)

    const search = getFilteredValue(filters, 'search')

    const renderAddress = useCallback(
        (_, property) => getAddressRender(property, null, search),
        [search])

    return useMemo(() => {
        const columns = [
            {
                title: AddressMessage,
                ellipsis: true,
                dataIndex: 'address',
                key: 'address',
                sorter: true,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                render: renderAddress,
                width: '70%',
            },
            {
                title: UnitsCountMessage,
                ellipsis: true,
                dataIndex: 'unitsCount',
                key: 'unitsCount',
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
        return columns
    }, [filters, sorters])
}

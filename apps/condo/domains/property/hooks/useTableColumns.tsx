import { PropertyWhereInput } from '@app/condo/schema'
import { FilterValue } from 'antd/es/table/interface'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import { getAddressRender, getDateRender } from '@condo/domains/common/components/Table/Renders'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'


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

export const useTableColumns = (filterMetas: FiltersMeta<PropertyWhereInput>[]) => {
    const intl = useIntl()
    const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Address' })
    const UnitsCountMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.UnitsCount' })
    const UninhabitedUnitsCountMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.UninhabitedUnitsCount' })
    const TasksInWorkMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.TasksInWorkCount' })
    const AddedDateMessage = intl.formatMessage({ id: 'AddedDate' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = useMemo(() => getSorterMap(sorters), [sorters])

    const search = getFilteredValue(filters, 'search')

    const renderAddress = useCallback((_, property) => {
        return getAddressRender(property, null, search)
    }, [search])

    return useMemo(() => {
        return [
            {
                title: AddressMessage,
                ellipsis: true,
                dataIndex: 'address',
                key: 'address',
                sorter: true,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                render: renderAddress,
                width: '30%',
            },
            {
                title: AddedDateMessage,
                dataIndex: 'createdAt',
                key: 'createdAt',
                sorter: true,
                sortOrder: sorterMap?.createdAt,
                width: '20%',
                render: getDateRender(intl, String(search)),
                filteredValue: getFilteredValue(filters, 'createdAt'),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'createdAt'),
                filterIcon: getFilterIcon,
            },
            {
                title: UnitsCountMessage,
                ellipsis: true,
                dataIndex: 'unitsCount',
                key: 'unitsCount',
                width: '15%',
            },
            {
                title: UninhabitedUnitsCountMessage,
                ellipsis: true,
                dataIndex: 'uninhabitedUnitsCount',
                key: 'uninhabitedUnitsCount',
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
    }, [AddedDateMessage, AddressMessage, TasksInWorkMessage, UninhabitedUnitsCountMessage, UnitsCountMessage, filterMetas, filters, intl, renderAddress, search, sorterMap])
}

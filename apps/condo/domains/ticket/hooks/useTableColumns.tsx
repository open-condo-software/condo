import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import map from 'lodash/map'
import { identity } from 'lodash/util'

import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { Ticket } from '@app/condo/schema'
import {
    getAddressRender,
    getDateRender,
    getTableCellRenderer,
} from '@condo/domains/common/components/Table/Renders'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getOptionFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { TicketCommentsTime, TicketStatus, UserTicketCommentReadTime } from '../utils/clientSchema'
import { convertGQLItemToFormSelectState } from '../utils/clientSchema/TicketStatus'
import { IFilters } from '../utils/helpers'
import {
    getClassifierRender, getStatusRender,
    getTicketClientNameRender,
    getTicketDetailsRender,
    getTicketNumberRender,
    getUnitRender,
} from '../utils/clientSchema/Renders'

const COLUMNS_WIDTH_ON_LARGER_XXL_SCREEN = {
    number: '8%',
    createdAt: '8%',
    status: '8%',
    address: '14%',
    unitName: '8%',
    details: '12%',
    categoryClassifier: '12%',
    clientName: '10%',
    executor: '10%',
    assignee: '10%',
}

const COLUMNS_WIDTH_SMALLER_XXL_SCREEN = {
    number: '10%',
    createdAt: '7%',
    status: '9%',
    address: '10%',
    unitName: '9%',
    details: '10%',
    categoryClassifier: '12%',
    clientName: '8%',
    executor: '11%',
    assignee: '10%',
}

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, tickets: Ticket[]) {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage = intl.formatMessage({ id: 'Status' })
    const ClientNameMessage = intl.formatMessage({ id: 'Contact' })
    const DescriptionMessage = intl.formatMessage({ id: 'Description' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleMessage = intl.formatMessage({ id: 'field.Responsible' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })
    const ClassifierTitle = intl.formatMessage({ id: 'Classifier' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const search = getFilteredValue(filters, 'search')
    const { breakpoints } = useLayoutContext()

    const { loading, objs: ticketStatuses } = TicketStatus.useNewObjects({})

    const renderStatusFilterDropdown = useCallback(({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const adaptedStatuses = ticketStatuses.map(convertGQLItemToFormSelectState).filter(identity)
        const filterProps = {
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
        }

        return getOptionFilterDropdown(adaptedStatuses, loading)(filterProps)
    }, [loading, ticketStatuses])

    const renderAddress = useCallback(
        (property) => getAddressRender(property, DeletedMessage, search),
        [DeletedMessage, search])

    const renderExecutor = useCallback(
        (executor) => getTableCellRenderer(search)(get(executor, ['name'])),
        [search])

    const renderAssignee = useCallback(
        (assignee) => getTableCellRenderer(search)(get(assignee, ['name'])),
        [search])

    const { user } = useAuth()

    const ticketIds = useMemo(() => map(tickets, 'id'), [tickets])
    const { objs: userTicketsCommentReadTime } = UserTicketCommentReadTime.useNewObjects({
        where: {
            user: { id: user.id },
            ticket: {
                id_in: ticketIds,
            },
        },
    })
    const { objs: ticketsCommentsTime } = TicketCommentsTime.useNewObjects({
        where: {
            ticket: {
                id_in: ticketIds,
            },
        },
    })

    const columnWidths = useMemo(() => breakpoints.xxl ?
        COLUMNS_WIDTH_ON_LARGER_XXL_SCREEN : COLUMNS_WIDTH_SMALLER_XXL_SCREEN,
    [breakpoints]
    )

    return useMemo(() => {
        return [
            {
                title: NumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue<IFilters>(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: columnWidths.number,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                filterIcon: getFilterIcon,
                render: getTicketNumberRender(intl, breakpoints, userTicketsCommentReadTime, ticketsCommentsTime, search),
                align: 'center',
            },
            {
                title: DateMessage,
                sortOrder: get(sorterMap, 'createdAt'),
                filteredValue: getFilteredValue<IFilters>(filters, 'createdAt'),
                dataIndex: 'createdAt',
                key: 'createdAt',
                sorter: true,
                width: columnWidths.createdAt,
                render: getDateRender(intl, String(search)),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'createdAt'),
                filterIcon: getFilterIcon,
            },
            {
                title: StatusMessage,
                sortOrder: get(sorterMap, 'status'),
                filteredValue: getFilteredValue<IFilters>(filters, 'status'),
                render: getStatusRender(intl, search),
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                width: columnWidths.status,
                filterDropdown: renderStatusFilterDropdown,
                filterIcon: getFilterIcon,
            },
            {
                title: AddressMessage,
                dataIndex: 'property',
                sortOrder: get(sorterMap, 'property'),
                filteredValue: getFilteredValue<IFilters>(filters, 'address'),
                key: 'address',
                sorter: true,
                width: columnWidths.address,
                render: renderAddress,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'address'),
                filterIcon: getFilterIcon,
            },
            {
                title: UnitMessage,
                dataIndex: 'unitName',
                sortOrder: get(sorterMap, 'unitName'),
                filteredValue: getFilteredValue(filters, 'unitName'),
                key: 'unitName',
                sorter: true,
                width: columnWidths.unitName,
                render: getUnitRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'unitName'),
                filterIcon: getFilterIcon,
                ellipsis: true,
            },
            {
                title: DescriptionMessage,
                dataIndex: 'details',
                filteredValue: getFilteredValue<IFilters>(filters, 'details'),
                key: 'details',
                width: columnWidths.details,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'details'),
                filterIcon: getFilterIcon,
                render: getTicketDetailsRender(search),
            },
            {
                title: ClassifierTitle,
                dataIndex: ['categoryClassifier', 'name'],
                filteredValue: getFilteredValue(filters, 'categoryClassifier'),
                key: 'categoryClassifier',
                width: columnWidths.categoryClassifier,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'categoryClassifier'),
                filterIcon: getFilterIcon,
                render: getClassifierRender(intl, search),
                ellipsis: true,
            },
            {
                title: ClientNameMessage,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue<IFilters>(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: columnWidths.clientName,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
                render: getTicketClientNameRender(search),
                filterIcon: getFilterIcon,
                ellipsis: true,
            },
            {
                title: ExecutorMessage,
                sortOrder: get(sorterMap, 'executor'),
                filteredValue: getFilteredValue<IFilters>(filters, 'executor'),
                dataIndex: 'executor',
                key: 'executor',
                sorter: true,
                width: columnWidths.executor,
                render: renderExecutor,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'executor'),
                filterIcon: getFilterIcon,
                ellipsis: true,
            },
            {
                title: ResponsibleMessage,
                sortOrder: get(sorterMap, 'assignee'),
                filteredValue: getFilteredValue<IFilters>(filters, 'assignee'),
                dataIndex: 'assignee',
                key: 'assignee',
                sorter: true,
                width: columnWidths.assignee,
                render: renderAssignee,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'assignee'),
                filterIcon: getFilterIcon,
                ellipsis: true,
            },
        ]
    }, [NumberMessage, sorterMap, filters, columnWidths.number, columnWidths.createdAt, columnWidths.status, columnWidths.address, columnWidths.unitName, columnWidths.details, columnWidths.categoryClassifier, columnWidths.clientName, columnWidths.executor, columnWidths.assignee, filterMetas, intl, breakpoints, userTicketsCommentReadTime, ticketsCommentsTime, search, DateMessage, StatusMessage, renderStatusFilterDropdown, AddressMessage, renderAddress, UnitMessage, DescriptionMessage, ClassifierTitle, ClientNameMessage, ExecutorMessage, renderExecutor, ResponsibleMessage, renderAssignee])
}

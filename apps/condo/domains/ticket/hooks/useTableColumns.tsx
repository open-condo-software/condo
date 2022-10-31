import { Dispatch, SetStateAction, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import map from 'lodash/map'
import { identity } from 'lodash/util'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
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
import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { useOrganization } from '@open-condo/next/organization'
import { RE_FETCH_TICKETS_IN_CONTROL_ROOM } from '@condo/domains/common/constants/featureflags'

import { TicketCommentsTime, TicketStatus, UserTicketCommentReadTime } from '../utils/clientSchema'
import { convertGQLItemToFormSelectState } from '../utils/clientSchema/TicketStatus'
import { IFilters } from '../utils/helpers'
import {
    getClassifierRender,
    getStatusRender,
    getTicketDetailsRender,
    getTicketNumberRender,
    getTicketUserNameRender,
    getUnitRender,
} from '../utils/clientSchema/Renders'

const COLUMNS_WIDTH = {
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

const TICKETS_RE_FETCH_INTERVAL = 60 * 1000

export function useTableColumns <T> (
    filterMetas: Array<FiltersMeta<T>>,
    tickets: Ticket[],
    refetchTickets: () => Promise<undefined>,
    isRefetching: boolean,
    setIsRefetching: Dispatch<SetStateAction<boolean>>,
) {
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

    const { loading: statusesLoading, objs: ticketStatuses } = TicketStatus.useObjects({})

    const renderStatusFilterDropdown = useCallback(({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const adaptedStatuses = ticketStatuses.map(convertGQLItemToFormSelectState).filter(identity)
        const filterProps = {
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
        }

        return getOptionFilterDropdown(adaptedStatuses, statusesLoading)(filterProps)
    }, [statusesLoading, ticketStatuses])

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
    const {
        objs: userTicketCommentReadTimes,
        refetch: refetchUserTicketCommentReadTimes,
        loading: userTicketCommentReadTimesLoading,
    } = UserTicketCommentReadTime.useObjects({
        where: {
            user: { id: get(user, 'id', null) },
            ticket: {
                id_in: ticketIds,
            },
        },
    })
    const {
        objs: ticketsCommentTimes,
        refetch: refetchTicketsCommentsTimes,
        loading: ticketCommentTimesLoading,
    } = TicketCommentsTime.useObjects({
        where: {
            ticket: {
                id_in: ticketIds,
            },
        },
    })

    const { useFlag, updateContext } = useFeatureFlags()
    const { organization } = useOrganization()

    useEffect(() => {
        updateContext({ organization: organization.id })
    }, [organization, updateContext])

    const isRefetchTicketsFeatureEnabled = useFlag(RE_FETCH_TICKETS_IN_CONTROL_ROOM)

    const refetch = useCallback(async () => {
        await refetchTickets()
        await refetchUserTicketCommentReadTimes()
        await refetchTicketsCommentsTimes()
    }, [refetchTickets, refetchTicketsCommentsTimes, refetchUserTicketCommentReadTimes])

    useEffect(() => {
        if (isRefetchTicketsFeatureEnabled) {
            const handler = setInterval(async () => {
                setIsRefetching(true)
                await refetch()
                setIsRefetching(false)
            }, TICKETS_RE_FETCH_INTERVAL)
            return () => {
                clearInterval(handler)
            }
        }
    }, [isRefetchTicketsFeatureEnabled, refetch, setIsRefetching])

    return useMemo(() => ({
        columns: [
            {
                title: NumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue<IFilters>(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: COLUMNS_WIDTH.number,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                filterIcon: getFilterIcon,
                render: getTicketNumberRender(intl, breakpoints, userTicketCommentReadTimes, ticketsCommentTimes, search),
                align: 'center',
            },
            {
                title: DateMessage,
                sortOrder: get(sorterMap, 'createdAt'),
                filteredValue: getFilteredValue<IFilters>(filters, 'createdAt'),
                dataIndex: 'createdAt',
                key: 'createdAt',
                sorter: true,
                width: COLUMNS_WIDTH.createdAt,
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
                width: COLUMNS_WIDTH.status,
                filterDropdown: renderStatusFilterDropdown,
                filterIcon: getFilterIcon,
            },
            {
                title: AddressMessage,
                dataIndex: 'property',
                sortOrder: get(sorterMap, 'property'),
                filteredValue: getFilteredValue<IFilters>(filters, 'property'),
                key: 'property',
                sorter: true,
                width: COLUMNS_WIDTH.address,
                render: renderAddress,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'property'),
                filterIcon: getFilterIcon,
            },
            {
                title: UnitMessage,
                dataIndex: 'unitName',
                sortOrder: get(sorterMap, 'unitName'),
                filteredValue: getFilteredValue(filters, 'unitName'),
                key: 'unitName',
                sorter: true,
                width: COLUMNS_WIDTH.unitName,
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
                width: COLUMNS_WIDTH.details,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'details'),
                filterIcon: getFilterIcon,
                render: getTicketDetailsRender(search),
            },
            {
                title: ClassifierTitle,
                dataIndex: ['classifier', 'category', 'name'],
                filteredValue: getFilteredValue(filters, 'categoryClassifier'),
                key: 'categoryClassifier',
                width: COLUMNS_WIDTH.categoryClassifier,
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
                width: COLUMNS_WIDTH.clientName,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
                render: getTicketUserNameRender(search),
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
                width: COLUMNS_WIDTH.executor,
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
                width: COLUMNS_WIDTH.assignee,
                render: renderAssignee,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'assignee'),
                filterIcon: getFilterIcon,
                ellipsis: true,
            },
        ],
        loading: userTicketCommentReadTimesLoading || ticketCommentTimesLoading || statusesLoading,
    }), [NumberMessage, sorterMap, filters, filterMetas, intl, breakpoints, userTicketCommentReadTimes, ticketsCommentTimes, search, DateMessage, StatusMessage, renderStatusFilterDropdown, AddressMessage, renderAddress, UnitMessage, DescriptionMessage, ClassifierTitle, ClientNameMessage, ExecutorMessage, renderExecutor, ResponsibleMessage, renderAssignee, userTicketCommentReadTimesLoading, ticketCommentTimesLoading, statusesLoading])
}

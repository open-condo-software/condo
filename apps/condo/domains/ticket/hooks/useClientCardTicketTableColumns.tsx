import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getDateRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { TicketComment } from '@condo/domains/ticket/utils/clientSchema'
import {
    getClassifierRender,
    getStatusRender,
    getTicketDetailsRender,
} from '@condo/domains/ticket/utils/clientSchema/Renders'
import { IFilters } from '@condo/domains/ticket/utils/helpers'


const renderCell = getTableCellRenderer()
const renderTicketDetails = getTicketDetailsRender()

export function useClientCardTicketTableColumns (tickets) {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage = intl.formatMessage({ id: 'Status' })
    const DescriptionMessage = intl.formatMessage({ id: 'Description' })
    const ClassifierTitle = intl.formatMessage({ id: 'Classifier' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const LastCommentMessage = intl.formatMessage({ id: 'phone.table.lastComment' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const ticketCommentsWhere = useMemo(() => tickets.map(ticket => ({
        AND: [
            { ticket: { id: ticket.id } },
            { createdAt: ticket.lastCommentAt },
        ],
    })), [tickets])
    const { objs: ticketComments } = TicketComment.useObjects({
        where: {
            OR: ticketCommentsWhere,
        },
    })

    const renderLastComment = useCallback((ticket) => {
        const lastComment = ticketComments.find(comment => get(comment, 'ticket.id') === ticket.id)

        if (lastComment) {
            return lastComment.content
        }
    }, [ticketComments])

    return useMemo(() => ([
        {
            title: AddressMessage,
            dataIndex: ['property', 'address'],
            key: 'property',
            sorter: true,
            render: renderCell,
            filterIcon: getFilterIcon,
        },
        {
            title: NumberMessage,
            dataIndex: 'number',
            key: 'number',
            render: renderCell,
            align: 'center',
            width: '10%',
        },
        {
            title: DateMessage,
            filteredValue: getFilteredValue<IFilters>(filters, 'createdAt'),
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: getDateRender(intl),
            width: '10%',
        },
        {
            title: StatusMessage,
            sortOrder: get(sorterMap, 'status'),
            render: getStatusRender(intl),
            dataIndex: 'status',
            key: 'status',
            width: '10%',
        },
        {
            title: ClassifierTitle,
            dataIndex: ['classifier', 'category', 'name'],
            key: 'categoryClassifier',
            render: getClassifierRender(intl),
            ellipsis: true,
        },
        {
            title: DescriptionMessage,
            dataIndex: 'details',
            key: 'details',
            render: renderTicketDetails,
        },
        {
            title: LastCommentMessage,
            key: 'lastComment',
            render: renderLastComment,
        },
    ]), [AddressMessage, NumberMessage, DateMessage, filters, intl, StatusMessage, sorterMap, ClassifierTitle, DescriptionMessage, LastCommentMessage, renderLastComment])
}

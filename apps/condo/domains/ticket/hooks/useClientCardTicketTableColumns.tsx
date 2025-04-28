import { GetTicketsForClientCardQuery, useGetTicketCommentsForClientCardQuery } from '@app/condo/gql'
import { CONTACT_PROPERTY_TICKETS_TAB, type TabKey } from '@app/condo/pages/phone/[number]'
import { TicketCommentWhereInput } from '@app/condo/schema'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { getFilterIcon } from '@condo/domains/common/components/Table/Filters'
import { getDateRender, getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import {
    getClassifierRender,
    getStatusRender,
    getTicketDetailsRender,
    getTicketUserNameRender,
    getUnitRender,
} from '@condo/domains/ticket/utils/clientSchema/Renders'
import { IFilters } from '@condo/domains/ticket/utils/helpers'

const renderCell = getTableCellRenderer()
const renderTicketDetails = getTicketDetailsRender()

export function useClientCardTicketTableColumns (tickets: GetTicketsForClientCardQuery['tickets'], currentTableTab: TabKey, maxTableSize: number) {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage = intl.formatMessage({ id: 'Status' })
    const DescriptionMessage = intl.formatMessage({ id: 'Description' })
    const ClassifierTitle = intl.formatMessage({ id: 'Classifier' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const UnitMessage = intl.formatMessage({ id: 'field.UnitName' })
    const LastCommentMessage = intl.formatMessage({ id: 'pages.condo.phone.table.lastComment' })
    const ContactMessage = intl.formatMessage({ id: 'Contact' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    const hasComments = tickets?.map(ticket => ticket.lastCommentAt).some(Boolean)

    const ticketCommentsWhere: TicketCommentWhereInput[] = useMemo(() =>
        tickets?.map(ticket => ({
            AND: [
                { ticket: { id: ticket.id } },
                { createdAt: ticket.lastCommentAt },
            ],
        })),
    [tickets])

    const { data: ticketCommentsQuery } = useGetTicketCommentsForClientCardQuery({
        variables: {
            where: { OR: ticketCommentsWhere },
            first: maxTableSize,
        },
        skip: !tickets || !hasComments,
    })

    const ticketComments = ticketCommentsQuery?.ticketComments

    const renderLastComment = useCallback((ticket) => {
        const lastComment = ticketComments?.find(comment => comment?.ticket?.id === ticket.id)

        if (lastComment) {
            return lastComment.content
        }
    }, [ticketComments])

    return useMemo(() => {
        const baseColumns = [
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
                sortOrder: sorterMap?.status,
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
        ]

        const columnsForPropertyAndEntranceTabs = [
            {
                title: UnitMessage,
                dataIndex: 'unitName',
                sortOrder: sorterMap.unitName,
                filteredValue: getFilteredValue(filters, 'unitName'),
                key: 'unitName',
                width: '10%',
                render: getUnitRender(intl, []),
            },
            {
                title: ContactMessage,
                sortOrder: sorterMap.clientName,
                dataIndex: 'clientName',
                key: 'clientName',
                width: '10%',
                render: getTicketUserNameRender([]),
                ellipsis: true,
            },
        ]

        const columnsForAddressTab = [
            {
                title: LastCommentMessage,
                key: 'lastComment',
                render: renderLastComment,
            },
        ]

        return currentTableTab !== CONTACT_PROPERTY_TICKETS_TAB
            ? [...baseColumns.slice(0, 1), ...columnsForPropertyAndEntranceTabs, ...baseColumns.slice(1)]
            : [...baseColumns, ...columnsForAddressTab]
    }, [
        AddressMessage, UnitMessage, NumberMessage, DateMessage, StatusMessage,
        ClassifierTitle, DescriptionMessage, LastCommentMessage,
        filters, intl, sorterMap, currentTableTab,
        renderCell, renderTicketDetails, renderLastComment, getFilterIcon,
    ])
}

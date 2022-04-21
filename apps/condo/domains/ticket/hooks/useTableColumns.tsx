import React, { CSSProperties, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import { identity } from 'lodash/util'
import { Space, Typography } from 'antd'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import styled from '@emotion/styled'

import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

import {
    getAddressRender,
    getDateRender,
    getTableCellRenderer,
    getHighlightedContents,
} from '@condo/domains/common/components/Table/Renders'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { colors } from '@condo/domains/common/constants/style'
import { getOptionFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { TICKET_TYPE_TAG_COLORS } from '@app/condo/domains/ticket/constants/style'

import { TicketStatus, UserTicketCommentRead } from '../utils/clientSchema'
import { convertGQLItemToFormSelectState } from '../utils/clientSchema/TicketStatus'
import {
    getDeadlineType,
    getHumanizeDeadlineDateDifference,
    hasUnreadResidentComments,
    IFilters,
    TicketDeadlineType,
} from '../utils/helpers'
import { getTicketClientNameRender, getTicketDetailsRender } from '../utils/clientSchema/Renders'
import { TicketTag } from '../components/TicketTag'

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

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
    number: '6%',
    createdAt: '7%',
    status: '9%',
    address: '10%',
    unitName: '9%',
    details: '10%',
    categoryClassifier: '12%',
    clientName: '8%',
    executor: '12%',
    assignee: '13%',
}

const NEW_COMMENTS_INDICATOR_WRAPPER_STYLES: CSSProperties = { position: 'relative', left: '-40px' }
const NewCommentIndicator = styled(Typography.Text)`
    display: block;
    width: 8px; 
    height: 8px; 
    border-radius: 100px; 
    background-color: ${colors.red[5]};
`

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>, tickets) {
    const intl = useIntl()
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' })
    const WarrantyMessage = intl.formatMessage({ id: 'Warranty' })
    const ReturnedMessage = intl.formatMessage({ id: 'Returned' })
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' })
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
    const ShortSectionNameMessage = intl.formatMessage({ id: 'field.ShortSectionName' })
    const ShortFloorNameMessage = intl.formatMessage({ id: 'field.ShortFloorName' })
    const LessThenDayMessage = intl.formatMessage({ id: 'ticket.deadline.LessThenDay' })
    const OverdueMessage = intl.formatMessage({ id: 'ticket.deadline.Overdue' })
    const NewResidentCommentMessage = intl.formatMessage({ id: 'ticket.newResidentComment' })

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const search = getFilteredValue(filters, 'search')
    const { breakpoints } = useLayoutContext()

    const { loading, objs: ticketStatuses } = TicketStatus.useObjects({})

    const renderStatus = useCallback((status, record) => {
        const { primary: backgroundColor, secondary: color } = status.colors
        const extraProps = { style: { color } }
        // TODO(DOMA-1518) find solution for cases where no status received
        const highlightedContent = getHighlightedContents(search, null, extraProps)(status.name)

        return (
            <Space direction='vertical' size={7}>
                {
                    status.name && (
                        <TicketTag color={backgroundColor}>
                            {highlightedContent}
                        </TicketTag>
                    )
                }
                {
                    record.isEmergency && (
                        <TicketTag color={TICKET_TYPE_TAG_COLORS.emergency}>
                            <Typography.Text type="danger">
                                {EmergencyMessage}
                            </Typography.Text>
                        </TicketTag>
                    )
                }
                {
                    record.isPaid && (
                        <TicketTag color={TICKET_TYPE_TAG_COLORS.paid}>
                            {PaidMessage}
                        </TicketTag>
                    )
                }
                {
                    record.isWarranty && (
                        <TicketTag color={TICKET_TYPE_TAG_COLORS.warranty}>
                            {WarrantyMessage}
                        </TicketTag>
                    )
                }
                {
                    record.statusReopenedCounter > 0 && (
                        <TicketTag color={TICKET_TYPE_TAG_COLORS.returned}>
                            {ReturnedMessage} {record.statusReopenedCounter > 1 && `(${record.statusReopenedCounter})`}
                        </TicketTag>
                    )
                }
            </Space>
        )
    }, [EmergencyMessage, PaidMessage, ReturnedMessage, WarrantyMessage, search])

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

    const renderClassifier = useCallback((text, record) => {
        const placeClassifier = get(record, ['placeClassifier', 'name'])
        const postfix = `\n(${placeClassifier})`

        return getTableCellRenderer(search, true, postfix, null, POSTFIX_PROPS)(text)
    }, [search])

    const renderUnit = useCallback((text, record) => {
        const sectionName = get(record, 'sectionName')
        const floorName = get(record, 'floorName')
        const unitType = get(record, 'unitType', 'flat')
        let unitNamePrefix = null
        let extraTitle = null
        const postfix = sectionName && floorName &&
            `\n${ShortSectionNameMessage} ${record.sectionName},\n${ShortFloorNameMessage} ${record.floorName}`
        if (text) {
            extraTitle = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` })
            if (unitType !== 'flat') {
                unitNamePrefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.prefix.${unitType}` })
            }
        }
        const unitName = text && unitNamePrefix ? `${unitNamePrefix} ${text}` : text
        return getTableCellRenderer(search, true, postfix, null, POSTFIX_PROPS, extraTitle)(unitName)
    }, [ShortFloorNameMessage, ShortSectionNameMessage, search])

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

    const ticketIds = useMemo(() => tickets.map(ticket => ticket.id), [tickets])
    const { objs: userTicketsCommentRead } = UserTicketCommentRead.useObjects({
        where: {
            user: { id: user.id },
            ticket: {
                id_in: ticketIds,
            },
        },
    })

    const renderNumber = useCallback((number, ticket) => {
        const deadline = dayjs(get(ticket, 'deadline'))
        let extraHighlighterProps
        let extraTitle

        if (deadline) {
            const deadlineType = getDeadlineType(ticket)

            switch (deadlineType) {
                case TicketDeadlineType.LESS_THAN_DAY: {
                    extraHighlighterProps = { type: 'warning' }
                    extraTitle = LessThenDayMessage

                    break
                }
                case TicketDeadlineType.OVERDUE: {
                    const { overdueDiff } = getHumanizeDeadlineDateDifference(ticket)

                    extraHighlighterProps = { type: 'danger' }
                    extraTitle = OverdueMessage.replace('{days}', overdueDiff)

                    break
                }
            }
        }

        const userTicketCommentRead = userTicketsCommentRead.find(obj => obj.ticket.id === ticket.id)
        const postfix = hasUnreadResidentComments(userTicketCommentRead, ticket) && (
            <div style={NEW_COMMENTS_INDICATOR_WRAPPER_STYLES}>
                <Tooltip title={NewResidentCommentMessage} placement={'topRight'}>
                    <NewCommentIndicator title={''} />
                </Tooltip>
            </div>
        )

        return getTableCellRenderer(search, false, postfix, extraHighlighterProps, null, extraTitle)(number)
    }, [LessThenDayMessage, OverdueMessage, search, userTicketsCommentRead])

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
                render: renderNumber,
                align: 'right',
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
                render: renderStatus,
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
                render: renderUnit,
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
                render: renderClassifier,
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
    }, [NumberMessage, sorterMap, filters, columnWidths.number, columnWidths.createdAt, columnWidths.status, columnWidths.address, columnWidths.unitName, columnWidths.details, columnWidths.categoryClassifier, columnWidths.clientName, columnWidths.executor, columnWidths.assignee, filterMetas, search, DateMessage, intl, StatusMessage, renderStatus, renderStatusFilterDropdown, AddressMessage, renderAddress, UnitMessage, renderUnit, DescriptionMessage, ClassifierTitle, renderClassifier, ClientNameMessage, ExecutorMessage, renderExecutor, ResponsibleMessage, renderAssignee])
}

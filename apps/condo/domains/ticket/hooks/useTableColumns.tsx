import React, { useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import { identity } from 'lodash/util'
import { Space, Tag, Typography } from 'antd'
import { TextProps } from 'antd/es/typography/Text'

import { useIntl } from '@core/next/intl'

import {
    getAddressRender,
    getDateRender,
    getTableCellRenderer,
    getHighlightedContents,
} from '@condo/domains/common/components/Table/Renders'
import { getFilteredValue } from '@condo/domains/common/utils/helpers'

import { getOptionFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { getSorterMap, parseQuery } from '@condo/domains/common/utils/tables.utils'
import { FiltersMeta, getFilterDropdownByKey } from '@condo/domains/common/utils/filters.utils'

import { EMERGENCY_TAG_COLOR } from '@condo/domains/ticket/constants/style'

import { TicketStatus } from '../utils/clientSchema'
import { convertGQLItemToFormSelectState } from '../utils/clientSchema/TicketStatus'
import { IFilters } from '../utils/helpers'
import { getTicketDetailsRender } from '../utils/clientSchema/Renders'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

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
    status: '8%',
    address: '10%',
    unitName: '10%',
    details: '10%',
    categoryClassifier: '12%',
    clientName: '8%',
    executor: '12%',
    assignee: '13%',
}

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' }).toLowerCase()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' }).toLowerCase()
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

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)
    const search = getFilteredValue(filters, 'search')
    const { breakpoints } = useLayoutContext()

    const { loading, objs: ticketStatuses } = TicketStatus.useObjects({})

    const renderStatus = useCallback((status, record) => {
        const { primary: color, secondary: backgroundColor } = status.colors
        const extraProps = { style: { color } }
        // TODO(DOMA-1518) find solution for cases where no status received
        const highlightedContent = getHighlightedContents(search, null, extraProps)(status.name)

        return (
            <Space direction='vertical' size={7}>
                {
                    status.name && (
                        <Tag color={backgroundColor}>
                            {highlightedContent}
                        </Tag>
                    )
                }
                {
                    record.isEmergency && (
                        <Tag color={EMERGENCY_TAG_COLOR.background}>
                            <Typography.Text type="danger">
                                {EmergencyMessage.toLowerCase()}
                            </Typography.Text>
                        </Tag>
                    )
                }
                {
                    record.isPaid && (
                        <Tag color='orange'>
                            {PaidMessage.toLowerCase()}
                        </Tag>
                    )
                }
            </Space>
        )
    }, [EmergencyMessage, PaidMessage, search])

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
        const postfix = sectionName && floorName &&
            `\n${ShortSectionNameMessage} ${record.sectionName},\n${ShortFloorNameMessage} ${record.floorName}`

        return getTableCellRenderer(search, true, postfix, null, POSTFIX_PROPS)(text)
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
                render: getTableCellRenderer(search),
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
                render: getTableCellRenderer(search),
                filterIcon: getFilterIcon,
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
            },
        ]
    }, [NumberMessage, sorterMap, filters, columnWidths.number, columnWidths.createdAt, columnWidths.status, columnWidths.address, columnWidths.unitName, columnWidths.details, columnWidths.categoryClassifier, columnWidths.clientName, columnWidths.executor, columnWidths.assignee, filterMetas, search, DateMessage, intl, StatusMessage, renderStatus, renderStatusFilterDropdown, AddressMessage, renderAddress, UnitMessage, renderUnit, DescriptionMessage, ClassifierTitle, renderClassifier, ClientNameMessage, ExecutorMessage, renderExecutor, ResponsibleMessage, renderAssignee])
}
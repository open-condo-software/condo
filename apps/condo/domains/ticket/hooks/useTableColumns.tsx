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

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
    const intl = useIntl()
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' }).toLowerCase()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' }).toLowerCase()
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage = intl.formatMessage({ id: 'Status' })
    const ClientNameMessage = intl.formatMessage({ id: 'Client' })
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

    const { loading, objs: ticketStatuses } = TicketStatus.useObjects({})

    const renderStatus = useCallback((status, record) => {
        const { primary: color, secondary: backgroundColor } = status.colors
        const extraProps = { style: { color } }
        // TODO(DOMA-1518) find solution for cases where no status received
        const highlightedContent = getHighlightedContents(search, null, extraProps)(status.name)

        return (
            <Space direction='vertical' size={7} align='center'>
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
        const postfix = `\n(${record.placeClassifier.name})`

        return getTableCellRenderer(search, true, postfix, null, POSTFIX_PROPS)(text)
    }, [search])

    const renderUnit = useCallback((text, record) => {
        const postfix = `\n${ShortSectionNameMessage} ${record.sectionName},\n${ShortFloorNameMessage} ${record.floorName}`

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

    return useMemo(() => {
        return [
            {
                title: NumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue<IFilters>(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: '8%',
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
                sorter: {
                    multiple: 1,
                },
                width: '8%',
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
                sorter: {
                    multiple: 2,
                },
                width: '8%',
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
                width: '14%',
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
                width: '8%',
                render: renderUnit,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'unitName'),
                filterIcon: getFilterIcon,
            },
            {
                title: DescriptionMessage,
                dataIndex: 'details',
                filteredValue: getFilteredValue<IFilters>(filters, 'details'),
                key: 'details',
                width: '12%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'details'),
                filterIcon: getFilterIcon,
                render: getTableCellRenderer(search, true),
            },
            {
                title: ClassifierTitle,
                dataIndex: ['categoryClassifier', 'name'],
                filteredValue: getFilteredValue(filters, 'categoryClassifier'),
                key: 'categoryClassifier',
                width: '12%',
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
                width: '10%',
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
                width: '10%',
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
                width: '10%',
                render: renderAssignee,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'assignee'),
                filterIcon: getFilterIcon,
            },
        ]
    }, [sorters, filters])
}
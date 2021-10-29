import React, { CSSProperties, useMemo } from 'react'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { identity } from 'lodash/util'
import { Checkbox, Space, Tag, Typography } from 'antd'

import { useIntl } from '@core/next/intl'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { getAddressDetails, getFilteredValue } from '@condo/domains/common/utils/helpers'

import { getHighlightedContents, getDateRender } from '@condo/domains/common/components/Table/Renders'
import { getDateFilterDropdown, getOptionFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getTextFilterDropdown, getFilterIcon, FilterContainer } from '@condo/domains/common/components/TableFilter'

import { EMERGENCY_TAG_COLOR } from '@condo/domains/ticket/constants/style'

import { TicketStatus } from '../utils/clientSchema'
import { convertGQLItemToFormSelectState } from '../utils/clientSchema/TicketStatus'
import { createSorterMap, IFilters } from '../utils/helpers'
import { TextHighlighter, TTextHighlighterProps } from '../../common/components/TextHighlighter'

const STATUS_FILTER_CHECKBOX_GROUP_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const useTableColumns = (
    sort: Array<string>,
    filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>
) => {
    const intl = useIntl()
    const EmergencyMessage = intl.formatMessage({ id: 'Emergency' }).toLowerCase()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const PaidMessage = intl.formatMessage({ id: 'Paid' }).toLowerCase()
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage =  intl.formatMessage({ id: 'Status' })
    const ClientNameMessage = intl.formatMessage({ id: 'Client' })
    const DescriptionMessage = intl.formatMessage({ id: 'Description' })
    const FindWordMessage = intl.formatMessage({ id: 'filters.FindWord' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const UserNameMessage = intl.formatMessage({ id: 'filters.UserName' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.ShortFlatNumber' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleMessage = intl.formatMessage({ id: 'field.Responsible' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' })

    const sorterMap = createSorterMap(sort)
    const { loading, objs: ticketStatuses } = TicketStatus.useObjects({})
    const search = getFilteredValue<IFilters>(filters, 'search')

    const renderStatus = (status, record) => {
        const { primary: color, secondary: backgroundColor } = status.colors
        const extraProps = { style: { color } }
        // TODO(DOMA-1518) find solution for cases where no status received
        const highlightedContent = getHighlightedContents(search, null, extraProps)(status.name)

        return (
            <Space direction='vertical' size={7} align='center'>
                {status.name &&
                    <Tag color={backgroundColor}>
                        {highlightedContent}
                    </Tag>
                }
                {record.isEmergency &&
                    <Tag color={EMERGENCY_TAG_COLOR.background}>
                        <Typography.Text type="danger">
                            {EmergencyMessage.toLowerCase()}
                        </Typography.Text>
                    </Tag>
                }
                {record.isPaid &&
                    <Tag color='orange'>
                        {PaidMessage.toLowerCase()}
                    </Tag>
                }
            </Space>
        )
    }

    const renderStatusFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const adaptedStatuses = ticketStatuses.map(convertGQLItemToFormSelectState).filter(identity)
        const filterProps = {
            setSelectedKeys,
            selectedKeys,
            confirm,
            clearFilters,
            beforeChange: () => { setFiltersApplied(true) },
        }

        return getOptionFilterDropdown(adaptedStatuses, loading)(filterProps)
    }

    const renderAddress = (record) => {
        const isDeleted = !!get(record, ['property', 'deletedAt'])
        const { text, unitPrefix } = getAddressDetails(record, ShortFlatNumber)
        const postfix = [unitPrefix]
        const extraProps: Partial<TTextHighlighterProps> = {}

        if (isDeleted) {
            postfix.push(`(${DeletedMessage})`)
            extraProps.type = 'secondary'
        }

        return getTableCellRenderer(search, true, postfix.join(' '), extraProps)(text)
    }

    return useMemo(() => {
        return [
            {
                title: NumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue<IFilters>(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: '7%',
                filterDropdown: getTextFilterDropdown(NumberMessage, setFiltersApplied),
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
                width: '8%',
                ellipsis: true,
                render: getDateRender(intl, String(search), true),
                filterDropdown: getDateFilterDropdown(),
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
                width: '10%',
                filterDropdown: renderStatusFilterDropdown,
                filterIcon: getFilterIcon,
            },
            {
                title: DescriptionMessage,
                dataIndex: 'details',
                filteredValue: getFilteredValue<IFilters>(filters, 'details'),
                key: 'details',
                width: '22%',
                filterDropdown: getTextFilterDropdown(FindWordMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: getTableCellRenderer(search, true),
            },
            {
                title: AddressMessage,
                ellipsis: false,
                sortOrder: get(sorterMap, 'property'),
                filteredValue: getFilteredValue<IFilters>(filters, 'property'),
                key: 'property',
                sorter: true,
                width: '19%',
                render: renderAddress,
                filterDropdown: getTextFilterDropdown(AddressMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
            },
            {
                title: ClientNameMessage,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue<IFilters>(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '12%',
                filterDropdown: getTextFilterDropdown(ClientNameMessage, setFiltersApplied),
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
                width: '12%',
                render: (executor) => getTableCellRenderer(search)(get(executor, ['name'])),
                filterDropdown: getTextFilterDropdown(UserNameMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
            },
            {
                title: ResponsibleMessage,
                sortOrder: get(sorterMap, 'assignee'),
                filteredValue: getFilteredValue<IFilters>(filters, 'assignee'),
                dataIndex: 'assignee',
                key: 'assignee',
                sorter: true,
                width: '12%',
                render: (assignee) => getTableCellRenderer(search)(get(assignee, ['name'])),
                filterDropdown: getTextFilterDropdown(UserNameMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
            },
        ]
    }, [sort, filters])
}

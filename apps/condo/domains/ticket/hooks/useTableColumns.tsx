import React, { CSSProperties, useMemo } from 'react'
import dayjs from 'dayjs'
import { get } from 'lodash'
import { identity } from 'lodash/util'
import { Checkbox, Space, Tag, Typography } from 'antd'

import { useIntl } from '@core/next/intl'

import { LOCALES } from '@condo/domains/common/constants/locale'

import getRenderer from '@condo/domains/common/components/helpers/tableCellRenderer'
import { getAddressDetails, getIntlMessages } from '@condo/domains/common/utils/helpers'

import { getDateFilterDropdown } from '@condo/domains/common/components/Table/Filters'
import { getTextFilterDropdown, getFilterIcon, FilterContainer } from '@condo/domains/common/components/TableFilter'

import { EMERGENCY_TAG_COLOR } from '@condo/domains/ticket/constants/style'

import { convertGQLItemToFormSelectState } from '../utils/clientSchema/TicketStatus'
import { createSorterMap, IFilters } from '../utils/helpers'
import { TicketStatus } from '../utils/clientSchema'
import { getFilteredValue } from '../utils/helpers'

import { getHighlited } from '../../common/components/helpers/highlited'
import { MessageSetMeta } from '../../common/types'

type MessageKeys = 'EmergencyMessage' | 'NumberMessage' | 'PaidMessage' | 'DateMessage'
| 'StatusMessage' | 'ClientNameMessage' | 'DescriptionMessage' | 'FindWordMessage'
| 'AddressMessage' | 'UserNameMessage' | 'ShortFlatNumber' | 'ExecutorMessage' | 'ResponsibleMessage'

const MESSAGES: MessageSetMeta<MessageKeys> = {
    EmergencyMessage: 'Emergency',
    NumberMessage: 'ticketsTable.Number',
    PaidMessage: 'Paid',
    DateMessage: 'Date',
    StatusMessage: 'Status',
    ClientNameMessage: 'Client',
    DescriptionMessage: 'Description',
    FindWordMessage: 'filters.FindWord',
    AddressMessage: 'field.Address',
    UserNameMessage: 'filters.UserName',
    ShortFlatNumber: 'field.FlatNumber',
    ExecutorMessage: 'field.Executor',
    ResponsibleMessage: 'field.Responsible',
}

const EMERGENCY_TAG_TEXT_STYLES = { color: EMERGENCY_TAG_COLOR.text }
const STATUS_FILTER_CHECKBOX_GROUP_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const useTableColumns = (sort: Array<string>, filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>) => {
    const intl = useIntl()
    const messages = getIntlMessages<MessageKeys>(intl, MESSAGES)

    const sorterMap = createSorterMap(sort)
    const { loading, objs: ticketStatuses } = TicketStatus.useObjects({})
    const search = getFilteredValue(filters, 'search')

    const renderStatus = (status, record) => {
        const { primary: color, secondary: backgroundColor } = status.colors
        const withHighlited = getHighlited(search, null)(status.name)

        return (
            <Space direction='vertical' size={7}>
                <Tag color={backgroundColor}>
                    <Typography.Text style={{ color }}>
                        {withHighlited}
                    </Typography.Text>
                </Tag>
                {record.isEmergency &&
                    <Tag color={EMERGENCY_TAG_COLOR.background}>
                        <Typography.Text style={EMERGENCY_TAG_TEXT_STYLES}>
                            {messages.EmergencyMessage.toLowerCase()}
                        </Typography.Text>
                    </Tag>
                }
                {record.isPaid &&
                    <Tag color='orange'>
                        {messages.PaidMessage.toLowerCase()}
                    </Tag>
                }
            </Space>
        )
    }

    const renderStatusFilterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const adaptedStatuses = ticketStatuses.map(convertGQLItemToFormSelectState).filter(identity)

        return (
            <FilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
            >
                <Checkbox.Group
                    disabled={loading}
                    options={adaptedStatuses}
                    style={STATUS_FILTER_CHECKBOX_GROUP_STYLES}
                    value={selectedKeys}
                    onChange={(e) => {
                        setSelectedKeys(e)
                        setFiltersApplied(true)
                        confirm({ closeDropdown: false })
                    }}
                />
            </FilterContainer>
        )
    }

    const renderAddress = (record) => {
        const { text, unitPrefix } = getAddressDetails(get(record, ['meter']), messages.ShortFlatNumber)

        return getRenderer(search, true, unitPrefix)(text)
    }

    const renderDate = (createdAt) => {
        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(createdAt).locale(locale) : dayjs(createdAt)
        return date.format('DD MMM')
    }

    return useMemo(() => {
        return [
            {
                title: messages.NumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: '7%',
                filterDropdown: getTextFilterDropdown(messages.NumberMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: getRenderer(search),
                align: 'right',
            },
            {
                title: messages.DateMessage,
                sortOrder: get(sorterMap, 'createdAt'),
                filteredValue: getFilteredValue(filters, 'createdAt'),
                dataIndex: 'createdAt',
                key: 'createdAt',
                sorter: true,
                width: '8%',
                ellipsis: true,
                render: renderDate,
                filterDropdown: getDateFilterDropdown(),
                filterIcon: getFilterIcon,
            },
            {
                title: messages.StatusMessage,
                sortOrder: get(sorterMap, 'status'),
                filteredValue: getFilteredValue(filters, 'status'),
                render: renderStatus,
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                width: '10%',
                filterDropdown: renderStatusFilterDropdown,
                filterIcon: getFilterIcon,
            },
            {
                title: messages.DescriptionMessage,
                dataIndex: 'details',
                filteredValue: getFilteredValue(filters, 'details'),
                key: 'details',
                width: '18%',
                filterDropdown: getTextFilterDropdown(messages.FindWordMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
                render: getRenderer(search, true),
            },
            {
                title: messages.AddressMessage,
                ellipsis: false,
                sortOrder: get(sorterMap, 'property'),
                filteredValue: getFilteredValue(filters, 'property'),
                key: 'property',
                sorter: true,
                width: '12%',
                render: renderAddress,
                filterDropdown: getTextFilterDropdown(messages.AddressMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
            },
            {
                title: messages.ClientNameMessage,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '12%',
                filterDropdown: getTextFilterDropdown(messages.ClientNameMessage, setFiltersApplied),
                render: getRenderer(search),
                filterIcon: getFilterIcon,
            },
            {
                title: messages.ExecutorMessage,
                sortOrder: get(sorterMap, 'executor'),
                filteredValue: getFilteredValue(filters, 'executor'),
                dataIndex: 'executor',
                key: 'executor',
                sorter: true,
                width: '15%',
                render: (executor) => getRenderer(search)(get(executor, ['name'])),
                filterDropdown: getTextFilterDropdown(messages.UserNameMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
            },
            {
                title: messages.ResponsibleMessage,
                sortOrder: get(sorterMap, 'assignee'),
                filteredValue: getFilteredValue(filters, 'assignee'),
                dataIndex: 'assignee',
                key: 'assignee',
                sorter: true,
                width: '18%',
                render: (assignee) => getRenderer(search)(get(assignee, ['name'])),
                filterDropdown: getTextFilterDropdown(messages.UserNameMessage, setFiltersApplied),
                filterIcon: getFilterIcon,
            },
        ]
    }, [sort, filters])
}

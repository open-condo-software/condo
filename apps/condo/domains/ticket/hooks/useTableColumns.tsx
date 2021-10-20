import { Checkbox, Space, Tag, Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { get, isEmpty } from 'lodash'
import { useIntl } from '@core/next/intl'
import React, { useMemo } from 'react'
import { colors } from '@condo/domains/common/constants/style'
import { EMERGENCY_TAG_COLOR } from '@condo/domains/ticket/constants/style'
import { IFilters } from '../utils/helpers'
import { Highliter } from '@condo/domains/common/components/Highliter'
import { getFilterIcon } from '@condo/domains/common/components/TableFilter'
import { FiltersMeta, getFilterDropdownByKey } from '../../common/utils/filters.utils'
import { useRouter } from 'next/router'
import { getSorterMap, parseQuery } from '../../common/utils/tables.utils'
import { getAddressRender, getDateRender, getTextRender } from '../../common/components/Table/Renders'
import { TextHighlighter } from '../../common/components/TextHighlighter'
import getRenderer from '@condo/domains/common/components/helpers/tableCellRenderer'

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

export function useTableColumns <T> (filterMetas: Array<FiltersMeta<T>>) {
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

    const router = useRouter()
    const { filters, sorters } = parseQuery(router.query)
    const sorterMap = getSorterMap(sorters)

    return useMemo(() => {
        let search = get(filters, 'search')
        search = Array.isArray(search) ? null : search

        const renderStatus = (status, record) => {
            const { primary: color, secondary: backgroundColor } = status.colors

            return (
                <Space direction='vertical' size={7}>
                    <Tag color={backgroundColor}>
                        {isEmpty(status.name)
                            ? <Typography.Text style={{ color }}>{status.name}</Typography.Text>
                            : (
                                <TextHighlighter
                                    text={String(status.name)}
                                    search={String(search)}
                                    renderPart={(part, startIndex, marked) => (
                                        <Typography.Text title={status.name} style={marked ? { backgroundColor: colors.markColor } : { color: color }}>
                                            {part}
                                        </Typography.Text>
                                    )}
                                />
                            )
                        }
                    </Tag>
                    {record.isEmergency &&
                    <Tag color={EMERGENCY_TAG_COLOR.background}>
                        <Typography.Text style={{ color: EMERGENCY_TAG_COLOR.text }}>
                            {EmergencyMessage}
                        </Typography.Text>
                    </Tag>
                    }
                    {record.isPaid &&
                    <Tag color={'orange'}>
                        {PaidMessage}
                    </Tag>
                    }
                </Space>
            )
        }

        const renderAddress = (record) => {
            const propertyWasDeleted = !!get(record, ['property', 'deletedAt'])
            const property = get(record, 'property')

            const unitName = get(record, 'unitName')
            const address = get(property, 'address')
            const unitPrefix = unitName ? `${ShortFlatNumber} ${unitName}` : ''

            if (propertyWasDeleted) {
                return (
                    <>
                        <TextHighlighter
                            text={String(address)}
                            search={String(search)}
                            renderPart={(part, startIndex, marked) => (
                                <Typography.Text
                                    title={`${address} ${unitPrefix}`}
                                    type={'secondary'}
                                    style={marked ? { backgroundColor: colors.markColor } : {}}
                                >
                                    {part}
                                </Typography.Text>
                            )}
                        />
                        <Typography.Text type={'secondary'} title={`${address} ${unitPrefix}`} >
                            { ' ' + unitPrefix } ({DeletedMessage})
                        </Typography.Text>
                    </>
                )
            }

            return getRenderer(search, true, unitPrefix)(address)
        }

        return [
            {
                title: NumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: '7%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'number'),
                filterIcon: getFilterIcon,
                render: getTextRender(search),
                align: 'right',
            },
            {
                title: DateMessage,
                sortOrder: get(sorterMap, 'createdAt'),
                filteredValue: getFilteredValue(filters, 'createdAt'),
                dataIndex: 'createdAt',
                key: 'createdAt',
                sorter: true,
                width: '8%',
                ellipsis: true,
                render: getDateRender(intl, search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'createdAt'),
                filterIcon: getFilterIcon,
            },
            {
                title: StatusMessage,
                sortOrder: get(sorterMap, 'status'),
                filteredValue: getFilteredValue(filters, 'status'),
                render: renderStatus,
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                width: '10%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'status'),
                filterIcon: getFilterIcon,
            },
            {
                title: DescriptionMessage,
                dataIndex: 'details',
                filteredValue: getFilteredValue(filters, 'details'),
                key: 'details',
                width: '18%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'details'),
                filterIcon: getFilterIcon,
                render: getTextRender(search),
            },
            {
                title: AddressMessage,
                ellipsis: false,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                key: 'address',
                sorter: true,
                width: '12%',
                render: renderAddress,
                filterDropdown: getFilterDropdownByKey(filterMetas, 'property'),
                filterIcon: getFilterIcon,
            },
            {
                title: ClientNameMessage,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '12%',
                filterDropdown: getFilterDropdownByKey(filterMetas, 'clientName'),
                render: getTextRender(search),
                filterIcon: getFilterIcon,
            },
            {
                title: ExecutorMessage,
                sortOrder: get(sorterMap, 'executor'),
                filteredValue: getFilteredValue(filters, 'executor'),
                dataIndex: ['executor', 'name'],
                key: 'executor',
                sorter: true,
                width: '15%',
                render: getTextRender(search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'executor'),
                filterIcon: getFilterIcon,
            },
            {
                title: ResponsibleMessage,
                sortOrder: get(sorterMap, 'assignee'),
                filteredValue: getFilteredValue(filters, 'assignee'),
                dataIndex: ['assignee', 'name'],
                key: 'assignee',
                sorter: true,
                width: '18%',
                render: getTextRender(search),
                filterDropdown: getFilterDropdownByKey(filterMetas, 'assignee'),
                filterIcon: getFilterIcon,
            },
        ]
    }, [filters])
}
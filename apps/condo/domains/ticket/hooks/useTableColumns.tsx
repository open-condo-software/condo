import { identity } from 'lodash/util'
import { Checkbox, DatePicker, Input, Space, Tag, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { FilterValue } from 'antd/es/table/interface'
import { format } from 'date-fns'
import { get, isEmpty } from 'lodash'
import { useIntl } from '@core/next/intl'
import moment from 'moment'
import React, { useMemo } from 'react'
import { FilterFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import { EMERGENCY_TAG_COLOR } from '@condo/domains/ticket/constants/style'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { convertGQLItemToFormSelectState } from '../utils/clientSchema/TicketStatus'
import { createSorterMap, IFilters } from '../utils/helpers'
import { TicketStatus } from '../utils/clientSchema'
import { Highliter } from '@condo/domains/common/components/Highliter'

const getFilterIcon = filtered => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />

interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
}

const FilterContainer: React.FC<IFilterContainerProps> = (props) => {
    const intl = useIntl()

    return (
        <div style={{ padding: 16 }}>
            <Space size={8} direction={'vertical'} align={'center'}>
                {props.children}
                {
                    props.showClearButton && (
                        <Button
                            size={'small'}
                            onClick={() => props.clearFilters()}
                            type={'inlineLink'}
                        >
                            {intl.formatMessage({ id: 'filters.Reset' })}
                        </Button>
                    )
                }
            </Space>
        </div>
    )
}

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

export const useTableColumns = (sort: Array<string>, filters: IFilters,
    setFiltersApplied: React.Dispatch<React.SetStateAction<boolean>>) => {
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
    const ShortFlatNumber = intl.formatMessage({ id: 'field.FlatNumber' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleMessage = intl.formatMessage({ id: 'field.Responsible' })

    const sorterMap = createSorterMap(sort)
    const { loading, objs: ticketStatuses } = TicketStatus.useObjects({})
    const search = getFilteredValue(filters, 'search')

    const render = (text) => {
        if (!text) return ''
        if (!isEmpty(search)) {
            return (
                <Highliter
                    text={String(text)}
                    search={String(search)}
                    renderPart={(part) => (
                        <Typography.Text style={{ backgroundColor: colors.markColor }}>
                            {part}
                        </Typography.Text>
                    )}
                />
            )
        }
        return text
    }

    const getFilterDropdown = (columnName: string) => {
        return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
            return (
                <FilterContainer clearFilters={clearFilters}
                    showClearButton={selectedKeys && selectedKeys.length > 0}>
                    <Input
                        placeholder={columnName}
                        value={selectedKeys}
                        onChange={e => {
                            setSelectedKeys(e.target.value)
                            setFiltersApplied(true)
                            confirm({ closeDropdown: false })
                        }}
                    />
                </FilterContainer>
            )
        }
    }

    return useMemo(() => {
        return [
            {
                title: NumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: '7%',
                render,
                filterDropdown: getFilterDropdown(NumberMessage),
                filterIcon: getFilterIcon,
            },
            {
                title: DateMessage,
                sortOrder: get(sorterMap, 'createdAt'),
                filteredValue: getFilteredValue(filters, 'createdAt'),
                dataIndex: 'createdAt',
                key: 'createdAt',
                sorter: true,
                width: '10%',
                render: (createdAt) => (
                    format(
                        new Date(createdAt),
                        'dd MMMM',
                        { locale: LOCALES[intl.locale] }
                    )
                ),
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    const pickerProps = {
                        value: undefined,
                        onChange: e => {
                            setSelectedKeys(e.toISOString())
                            setFiltersApplied(true)
                            confirm({ closeDropdown: false })
                        },
                        allowClear: false,
                    }

                    if (selectedKeys && selectedKeys.length > 0) {
                        pickerProps.value = moment(selectedKeys)
                    }

                    return (
                        <FilterContainer clearFilters={clearFilters}
                            showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <DatePicker {...pickerProps}/>
                        </FilterContainer>
                    )
                },
                filterIcon: getFilterIcon,
            },
            {
                title: StatusMessage,
                sortOrder: get(sorterMap, 'status'),
                filteredValue: getFilteredValue(filters, 'status'),
                render: (status, record) => {
                    const { primary: color, secondary: backgroundColor } = status.colors
                    return (
                        <Space direction='vertical' size={7}>
                            <Tag color={backgroundColor}>
                                <Typography.Text style={{ color }}>{
                                    isEmpty(status.name)
                                        ? status.name
                                        : (
                                            <Highliter
                                                text={status.name}
                                                search={String(search)}
                                                renderPart={(part) => (
                                                    <Typography.Text style={{ backgroundColor: colors.markColor }}>
                                                        {part}
                                                    </Typography.Text>
                                                )}
                                            />
                                        )}</Typography.Text>
                            </Tag>
                            {record.isEmergency &&
                            <Tag color={EMERGENCY_TAG_COLOR.background}>
                                <Typography.Text
                                    style={{ color: EMERGENCY_TAG_COLOR.text }}>{EmergencyMessage}</Typography.Text>
                            </Tag>}
                            { record.isPaid &&
                            <Tag color={'orange'}>
                                { PaidMessage }
                            </Tag> }
                        </Space>
                    )
                },
                dataIndex: 'status',
                key: 'status',
                sorter: true,
                width: '10%',
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    const adaptedStatuses = ticketStatuses.map(convertGQLItemToFormSelectState).filter(identity)

                    return (
                        <FilterContainer
                            clearFilters={clearFilters}
                            showClearButton={selectedKeys && selectedKeys.length > 0}
                        >
                            <Checkbox.Group
                                disabled={loading}
                                options={adaptedStatuses}
                                style={{ display: 'flex', flexDirection: 'column' }}
                                value={selectedKeys}
                                onChange={(e) => {
                                    setSelectedKeys(e)
                                    setFiltersApplied(true)
                                    confirm({ closeDropdown: false })
                                }}
                            />
                        </FilterContainer>
                    )
                },
                filterIcon: getFilterIcon,
            },
            {
                title: DescriptionMessage,
                ellipsis: true,
                dataIndex: 'details',
                filteredValue: getFilteredValue(filters, 'details'),
                key: 'details',
                width: '18%',
                render,
                filterDropdown: getFilterDropdown(FindWordMessage),
                filterIcon: getFilterIcon,
            },
            {
                title: AddressMessage,
                ellipsis: false,
                sortOrder: get(sorterMap, 'property'),
                filteredValue: getFilteredValue(filters, 'property'),
                key: 'property',
                sorter: true,
                width: '12%',
                render: (record) => {
                    const unitName = get(record, 'unitName')
                    const property = get(record, 'property')
                    const text = get(property, 'address')
                    const unitPrefix = unitName ? `${ShortFlatNumber} ${unitName}` : ''

                    if (!isEmpty(search)) {
                        return (
                            <>
                                <Highliter
                                    text={text}
                                    search={String(search)}
                                    renderPart={(part) => (
                                        <Typography.Text style={{ backgroundColor: colors.markColor }}>
                                            {part}
                                        </Typography.Text>
                                    )}
                                />
                                {` ${unitPrefix}`}
                            </>
                        )
                    }
                    return `${text} ${unitPrefix}`
                },
                filterDropdown: getFilterDropdown(AddressMessage),
                filterIcon: getFilterIcon,
            },
            {
                title: ClientNameMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '12%',
                filterDropdown: getFilterDropdown(ClientNameMessage),
                render,
                filterIcon: getFilterIcon,
            },
            {
                title: ExecutorMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'executor'),
                filteredValue: getFilteredValue(filters, 'executor'),
                dataIndex: 'executor',
                key: 'executor',
                sorter: true,
                width: '16%',
                render: (executor) => render(get(executor, ['name'])),
                filterDropdown: getFilterDropdown(UserNameMessage),
                filterIcon: getFilterIcon,
            },
            {
                title: ResponsibleMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'assignee'),
                filteredValue: getFilteredValue(filters, 'assignee'),
                dataIndex: 'assignee',
                key: 'assignee',
                sorter: true,
                width: '18%',
                render: (assignee) => render(get(assignee, ['name'])),
                filterDropdown: getFilterDropdown(UserNameMessage),
                filterIcon: getFilterIcon,
            },
        ]
    }, [sort, filters])
}

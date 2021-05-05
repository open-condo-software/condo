import { identity } from 'lodash/util'
import { Tag, Typography, Input, Space, DatePicker, Checkbox } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { FilterValue } from 'antd/es/table/interface'
import { format } from 'date-fns'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import moment from 'moment'
import React, { useMemo } from 'react'
import { FilterFilled } from '@ant-design/icons'
import { STATUS_SELECT_COLORS } from '@condo/domains/ticket/constants/style'
import { colors } from '@condo/domains/common/constants/style'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { convertGQLItemToFormSelectState } from '../utils/clientSchema/TicketStatus'
import { createSorterMap, IFilters } from '../utils/helpers'
import { TicketStatus } from '../utils/clientSchema'

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

export const useTableColumns = (sort: Array<string>, filters: IFilters) => {
    const intl = useIntl()
    const NumberMessage = intl.formatMessage({ id: 'ticketsTable.Number' })
    const DateMessage = intl.formatMessage({ id: 'Date' })
    const StatusMessage =  intl.formatMessage({ id: 'Status' })
    const DescriptionMessage = intl.formatMessage({ id: 'Description' })
    const FindWordMessage = intl.formatMessage({ id: 'filters.FindWord' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const UserNameMessage = intl.formatMessage({ id: 'filters.UserName' })

    const sorterMap = createSorterMap(sort)
    const { loading, objs: ticketStatuses } = TicketStatus.useObjects({})

    const columns = useMemo(() => {
        return [
            {
                title: NumberMessage,
                sortOrder: get(sorterMap, 'number'),
                filteredValue: getFilteredValue(filters, 'number'),
                dataIndex: 'number',
                key: 'number',
                sorter: true,
                width: '10%',
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={NumberMessage}
                                value={selectedKeys}
                                onChange={e => {
                                    setSelectedKeys(e.target.value)
                                    confirm({ closeDropdown: false })
                                }}
                            />
                        </FilterContainer>
                    )
                },
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
                            confirm({ closeDropdown: false })
                        },
                        allowClear: false,
                    }

                    if (selectedKeys && selectedKeys.length > 0) {
                        pickerProps.value = moment(selectedKeys)
                    }

                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
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
                render: (status) => {
                    const { color, backgroundColor } = STATUS_SELECT_COLORS[status.type]

                    return (
                        <Tag color={backgroundColor} style={{ color }}>
                            <Typography.Text strong>{status.name}</Typography.Text>
                        </Tag>
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
                width: '22%',
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={FindWordMessage}
                                value={selectedKeys}
                                onChange={e => {
                                    setSelectedKeys(e.target.value)
                                    confirm({ closeDropdown: false })
                                }}
                            />
                        </FilterContainer>
                    )
                },
                filterIcon: getFilterIcon,
            },
            {
                title: AddressMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'property'),
                filteredValue: getFilteredValue(filters, 'property'),
                dataIndex: 'property',
                key: 'property',
                sorter: true,
                width: '12%',
                render: (property) => (`${get(property, 'address')} ${get(property, 'name')}`),
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={AddressMessage}
                                value={selectedKeys}
                                onChange={e => {
                                    setSelectedKeys(e.target.value)
                                    confirm({ closeDropdown: false })
                                }}
                            />
                        </FilterContainer>
                    )
                },
                filterIcon: getFilterIcon,
            },
            {
                title: intl.formatMessage({ id: 'Client' }),
                ellipsis: true,
                sortOrder: get(sorterMap, 'clientName'),
                filteredValue: getFilteredValue(filters, 'clientName'),
                dataIndex: 'clientName',
                key: 'clientName',
                sorter: true,
                width: '12%',
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={UserNameMessage}
                                value={selectedKeys}
                                onChange={e => {
                                    setSelectedKeys(e.target.value)
                                    confirm({ closeDropdown: false })
                                }}
                            />
                        </FilterContainer>
                    )
                },
                filterIcon: getFilterIcon,
            },
            {
                title: intl.formatMessage({ id: 'field.Executor' }),
                ellipsis: true,
                sortOrder: get(sorterMap, 'executor'),
                filteredValue: getFilteredValue(filters, 'executor'),
                dataIndex: 'executor',
                key: 'executor',
                sorter: true,
                width: '12%',
                render: (executor) => (get(executor, ['name'])),
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={UserNameMessage}
                                value={selectedKeys}
                                onChange={e => {
                                    setSelectedKeys(e.target.value)
                                    confirm({ closeDropdown: false })
                                }}
                            />
                        </FilterContainer>
                    )
                },
                filterIcon: getFilterIcon,
            },
            {
                title: intl.formatMessage({ id: 'field.Responsible' }),
                ellipsis: true,
                sortOrder: get(sorterMap, 'assignee'),
                filteredValue: getFilteredValue(filters, 'assignee'),
                dataIndex: 'assignee',
                key: 'assignee',
                sorter: true,
                width: '12%',
                render: (assignee) => (get(assignee, ['name'])),
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={UserNameMessage}
                                value={selectedKeys}
                                onChange={e => {
                                    confirm({ closeDropdown: false })
                                    setSelectedKeys(e.target.value)
                                }}
                            />
                        </FilterContainer>
                    )
                },
                filterIcon: getFilterIcon,
            },
        ]
    }, [sort, filters])

    return columns
}
import { identity } from 'lodash/util'
import { Input, Space, Checkbox } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'
import { useIntl } from '@core/next/intl'
import React, { useMemo } from 'react'
import { FilterFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import { createSorterMap, IFilters } from '../utils/helpers'
import { OrganizationEmployeeRole } from '../utils/clientSchema'
import { useOrganization } from '../../../../../packages/@core.next/organization'

const getFilterIcon = filtered => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />

interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
}

const FilterContainer: React.FC<IFilterContainerProps> = (props) => {
    const intl = useIntl()
    const ResetLabel = intl.formatMessage({ id: 'filters.Reset' })

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
                            {ResetLabel}
                        </Button>
                    )
                }
            </Space>
        </div>
    )
}

const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

export const useTableColumns = (organizationId: string, sort: Array<string>, filters: IFilters) => {
    const intl = useIntl()
    const NameMessage = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const RoleMessage = intl.formatMessage({ id: 'employee.Role' })
    const PositionMessage = intl.formatMessage({ id: 'employee.Position' })
    const PhoneMessage =  intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })

    const sorterMap = createSorterMap(sort)
    const { loading, objs: organizationEmployeeRoles } = OrganizationEmployeeRole.useObjects({ where: { organization: { id: organizationId } } })
    const columns = useMemo(() => {
        return [
            {
                title: NameMessage,
                sortOrder: get(sorterMap, 'name'),
                filteredValue: getFilteredValue(filters, 'name'),
                dataIndex: 'name',
                key: 'name',
                sorter: true,
                width: '40%',
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={NameMessage}
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
                title: PositionMessage,
                sortOrder: get(sorterMap, 'position'),
                filteredValue: getFilteredValue(filters, 'position'),
                dataIndex: 'position',
                key: 'position',
                sorter: true,
                width: '20%',
                render: (position) => position ? position : '—',
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={PositionMessage}
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
                title: RoleMessage,
                sortOrder: get(sorterMap, 'role'),
                filteredValue: getFilteredValue(filters, 'role'),
                dataIndex: 'role',
                key: 'role',
                sorter: true,
                width: '20%',
                render: (role) => get(role, 'name', '—'),
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    const adaptedStatuses = organizationEmployeeRoles.map(OrganizationEmployeeRole.convertGQLItemToFormSelectState).filter(identity)

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
                title: PhoneMessage,
                sortOrder: get(sorterMap, 'phone'),
                filteredValue: getFilteredValue(filters, 'phone'),
                dataIndex: 'phone',
                key: 'phone',
                sorter: true,
                width: '20%',
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={PhoneMessage}
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
                title: EmailMessage,
                ellipsis: true,
                dataIndex: 'email',
                filteredValue: getFilteredValue(filters, 'email'),
                key: 'email',
                width: '20%',
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
                    return (
                        <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                            <Input
                                placeholder={EmailMessage}
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
        ]
    }, [sort, filters])

    return columns
}
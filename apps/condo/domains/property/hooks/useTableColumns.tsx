import { FilterFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import { FilterValue } from 'antd/es/table/interface'

import React, { useMemo } from 'react'
import { useIntl } from '@core/next/intl'

import { createSorterMap, IFilters } from '../utils/helpers'
import get from 'lodash/get'

import { Input, Space } from 'antd'
import { Button } from '@condo/domains/common/components/Button'



interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
}

const FilterContainer: React.FC<IFilterContainerProps> = (props) => {
    const intl = useIntl()
    const ResetFilter = intl.formatMessage({ id: 'filters.Reset' })
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
                            {ResetFilter}
                        </Button>
                    )
                }
            </Space>
        </div>
    )
}


interface ITableColumn {
    title: string,
    ellipsis?: boolean,
    sortOrder?: string,
    filteredValue?: FilterValue,
    dataIndex?: string,
    key?: string,
    sorter?: boolean,
    width?: string,
    filterDropdown?: unknown,
    filterIcon?: unknown
}



const getFilterIcon = filtered => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />
const getFilteredValue = (filters: IFilters, key: string | Array<string>): FilterValue => get(filters, key, null)

export const useTableColumns = (sort: Array<string>, filters: IFilters): Array<ITableColumn> => {
    const intl = useIntl()
    const columns = useMemo(() => {
        const AddressMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.Address' })
        const UnitsCountMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.UnitsCount' })
        const TasksInWorkMessage = intl.formatMessage({ id: 'pages.condo.property.index.TableField.TasksInWorkCount' })
        const sorterMap = createSorterMap(sort)
        return [
            {
                title: AddressMessage,
                ellipsis: true,
                sortOrder: get(sorterMap, 'address'),
                filteredValue: getFilteredValue(filters, 'address'),
                dataIndex: 'address',
                key: 'address',
                sorter: true,
                width: '50%',
                filterDropdown: function AddressFilterDropDown ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) {
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
                title: UnitsCountMessage,
                ellipsis: true,
                dataIndex: 'unitsCount',
                key: 'unitsCount',
                width: '25%',
            },       
            {
                title: TasksInWorkMessage,
                ellipsis: true,
                dataIndex: 'ticketsInWork',
                key: 'ticketsInWork',
                width: '25%',
            },                 
        ]
    }, [sort, filters, intl])

    return columns
}

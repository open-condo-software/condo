import { FilterFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import React from 'react'
import { Checkbox, DatePicker, Input } from 'antd'
import { FilterContainer } from '../TableFilter'
import { OptionType, QueryArgType } from '../../utils/tables.utils'
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'
import moment from 'moment'

type FilterIconType = (filtered?: boolean) => React.ReactNode
type FilterValueType = (path: string | Array<string>, filters: { [x: string]: QueryArgType }) => FilterValue


export const getFilterIcon: FilterIconType = (filtered) => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />
export const getFilterValue: FilterValueType = (path, filters) => get(filters, path, null)

export const getTextFilterDropdown = (placeholder: string) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <FilterContainer clearFilters={clearFilters} showClearButton={selectedKeys && selectedKeys.length > 0}>
                <Input
                    placeholder={placeholder}
                    value={selectedKeys}
                    onChange={e => {
                        setSelectedKeys(e.target.value)
                        confirm({ closeDropdown: false })
                    }}
                />
            </FilterContainer>
        )
    }
}

export const getOptionFilterDropdown = (options: Array<OptionType>, loading: boolean) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <FilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
            >
                <Checkbox.Group
                    disabled={loading}
                    options={options}
                    style={{ display: 'flex', flexDirection: 'column' }}
                    value={selectedKeys}
                    onChange={(e) => {
                        setSelectedKeys(e)
                        confirm({ closeDropdown: false })
                    }}
                />
            </FilterContainer>
        )
    }
}

export const getDateFilterDropdown = () => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
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
            <FilterContainer clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}>
                <DatePicker {...pickerProps}/>
            </FilterContainer>
        )
    }
}
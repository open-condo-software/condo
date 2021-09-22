import { FilterFilled } from '@ant-design/icons'
import { colors } from '@condo/domains/common/constants/style'
import React, { CSSProperties } from 'react'
import { Checkbox, Input } from 'antd'
import DatePicker from '../Pickers/DatePicker'
import { FilterContainer, SelectFilterContainer } from '../TableFilter'
import { OptionType, QueryArgType } from '../../utils/tables.utils'
import { FilterValue } from 'antd/es/table/interface'
import get from 'lodash/get'
import dayjs from 'dayjs'
import { GraphQlSearchInput } from '../GraphQlSearchInput'
import DateRangePicker from '../Pickers/DateRangePicker'

type FilterIconType = (filtered?: boolean) => React.ReactNode
type FilterValueType = (path: string | Array<string>, filters: { [x: string]: QueryArgType }) => FilterValue


export const getFilterIcon: FilterIconType = (filtered) => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />
export const getFilterValue: FilterValueType = (path, filters) => get(filters, path, null)

export const getTextFilterDropdown = (placeholder: string, containerStyles?: CSSProperties) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <FilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
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

export const getOptionFilterDropdown = (options: Array<OptionType>, loading: boolean, containerStyles?: CSSProperties) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <FilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
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

export const getGQLSelectFilterDropdown = (search, mode?: 'multiple' | 'tag', containerStyles?: CSSProperties) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <SelectFilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                <GraphQlSearchInput
                    style={{ width: '100%' }}
                    search={search}
                    showArrow
                    mode={mode}
                    value={selectedKeys}
                    onChange={(e) => {
                        setSelectedKeys(e)
                        confirm({ closeDropdown: false })
                    }}
                />
            </SelectFilterContainer>
        )
    }
}

export const getDateFilterDropdown = (containerStyles?: CSSProperties) => {
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
            pickerProps.value = dayjs(selectedKeys)
        }

        return (
            <FilterContainer clearFilters={clearFilters}
                style={containerStyles}
                showClearButton={selectedKeys && selectedKeys.length > 0}>
                <DatePicker {...pickerProps}/>
            </FilterContainer>
        )
    }
}

export const getDateRangeFilterDropdown = (containerStyles?: CSSProperties) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const pickerProps = {
            value: undefined,
            onChange: e => {
                setSelectedKeys([e[0].toISOString(), e[1].toISOString()])
                confirm({ closeDropdown: false })
            },
            allowClear: false,
        }

        if (selectedKeys && selectedKeys.length > 0) {
            pickerProps.value = [dayjs(selectedKeys[0]), dayjs(selectedKeys[1])]
        }

        return (
            <FilterContainer clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                <DateRangePicker {...pickerProps}/>
            </FilterContainer>
        )
    }
}
import React, { ComponentProps, CSSProperties, useCallback, useState } from 'react'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import dayjs from 'dayjs'
import Input from '@condo/domains/common/components/antd/Input'
import Select from '@condo/domains/common/components/antd/Select'
import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import { FilterValue } from 'antd/es/table/interface'
import { FilterFilled } from '@ant-design/icons'
import { ApolloClient } from '@apollo/client'

import { colors } from '@condo/domains/common/constants/style'

import { OptionType, QueryArgType } from '../../utils/tables.utils'
import DatePicker from '../Pickers/DatePicker'
import { FilterContainer, SelectFilterContainer } from '../TableFilter'
import { GraphQlSearchInput } from '../GraphQlSearchInput'
import DateRangePicker from '../Pickers/DateRangePicker'
import SelectTags from '../antd/SelectTags'

type FilterIconType = (filtered?: boolean) => React.ReactNode
type FilterValueType = (path: string | Array<string>, filters: { [x: string]: QueryArgType }) => FilterValue

const FILTER_DROPDOWN_CHECKBOX_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const getFilterIcon: FilterIconType = (filtered) => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />
export const getFilterValue: FilterValueType = (path, filters) => get(filters, path, null)

export const getTextFilterDropdown = (placeholder: string, containerStyles?: CSSProperties) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const [value, setValue] = useState('')
        const handleClear = useCallback(() => {
            setValue('')
            isFunction(clearFilters) && clearFilters()
        }, [clearFilters])

        return (
            <FilterContainer
                clearFilters={handleClear}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                <Input
                    placeholder={placeholder}
                    value={value}
                    onChange={e => {
                        setValue(e.target.value)
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
                    style={FILTER_DROPDOWN_CHECKBOX_STYLES}
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

const DROPDOWN_SELECT_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const getSelectFilterDropdown = (selectProps: ComponentProps<typeof Select>, containerStyles?: CSSProperties) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <SelectFilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                {selectProps.mode === 'tags' ?
                    <SelectTags
                        showArrow
                        style={DROPDOWN_SELECT_STYLE}
                        value={selectedKeys}
                        optionFilterProp={'label'}
                        onChange={(e) => {
                            setSelectedKeys(e)
                            confirm({ closeDropdown: false })
                        }}
                        {...selectProps}
                    /> :
                    <Select
                        showArrow
                        style={DROPDOWN_SELECT_STYLE}
                        value={selectedKeys}
                        optionFilterProp={'label'}
                        onChange={(e) => {
                            setSelectedKeys(e)
                            confirm({ closeDropdown: false })
                        }}
                        {...selectProps}
                    />
                }
            </SelectFilterContainer>
        )
    }
}

const GRAPHQL_SEARCH_INPUT_STYLE: CSSProperties = { width: '100%' }

export const getGQLSelectFilterDropdown = (
    props: ComponentProps<typeof GraphQlSearchInput>,
    search: (client: ApolloClient<Record<string, unknown>>, queryArguments: string) => Promise<Array<Record<string, unknown>>>,
    mode?: ComponentProps<typeof GraphQlSearchInput>['mode'],
    containerStyles?: CSSProperties
) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        return (
            <SelectFilterContainer
                clearFilters={clearFilters}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                <GraphQlSearchInput
                    style={GRAPHQL_SEARCH_INPUT_STYLE}
                    search={search}
                    showArrow
                    mode={mode}
                    value={selectedKeys}
                    onChange={(e) => {
                        setSelectedKeys(e)
                        confirm({ closeDropdown: false })
                    }}
                    {...props}
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
                showClearButton={selectedKeys && selectedKeys.length > 0}
            >
                <DatePicker {...pickerProps}/>
            </FilterContainer>
        )
    }
}

export const getDateRangeFilterDropdown = (
    props: ComponentProps<typeof DateRangePicker>,
    containerStyles?: CSSProperties
) => {
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
                <DateRangePicker {...pickerProps} {...props}/>
            </FilterContainer>
        )
    }
}

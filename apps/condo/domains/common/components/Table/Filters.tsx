import { FilterFilled } from '@ant-design/icons'
import { FilterValue } from 'antd/es/table/interface'
import { CheckboxGroupProps } from 'antd/lib/checkbox/Group'
import { PickerProps, RangePickerProps } from 'antd/lib/date-picker/generatePicker'
import { FilterDropdownProps } from 'antd/lib/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input, { CustomInputProps } from '@condo/domains/common/components/antd/Input'
import Select, { CustomSelectProps, SelectValueType } from '@condo/domains/common/components/antd/Select'
import { GraphQlSearchInput, ISearchInputProps } from '@condo/domains/common/components/GraphQlSearchInput'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { FilterContainer, SelectFilterContainer } from '@condo/domains/common/components/TableFilter'
import { colors } from '@condo/domains/common/constants/style'
import { QueryArgType } from '@condo/domains/common/utils/tables.utils'

import { TrackingEventType, useTracking } from '../TrackingContext'


type FilterIconType = (filtered?: boolean) => React.ReactNode
type FilterValueType = (path: string | Array<string>, filters: { [x: string]: QueryArgType }) => FilterValue

type CommonFilterDropdownProps = { containerStyles?: CSSProperties }
type GetCommonFilterDropdownType<P> = (props?: P) => (props: FilterDropdownProps) => React.ReactNode

type GetTextFilterDropdownType = GetCommonFilterDropdownType<{ inputProps?: CustomInputProps } & CommonFilterDropdownProps>

type GetOptionFilterDropdownType = GetCommonFilterDropdownType<{ checkboxGroupProps?: CheckboxGroupProps & { id?: string } } & CommonFilterDropdownProps>

type GetSelectFilterDropdownProps<ValueType> = { selectProps?: CustomSelectProps<ValueType> } & CommonFilterDropdownProps
type GetSelectFilterDropdownType<ValueType> = GetCommonFilterDropdownType<GetSelectFilterDropdownProps<ValueType>>

type GetGQLSelectFilterDropdownType = GetCommonFilterDropdownType<{ gqlSelectProps?: ISearchInputProps } & CommonFilterDropdownProps>

type GetDateFilterDropdownType = GetCommonFilterDropdownType<{ datePickerProps?: PickerProps<Dayjs> } & CommonFilterDropdownProps>

type GetDateRangeFilterDropdownType = GetCommonFilterDropdownType<{ datePickerProps?: RangePickerProps<Dayjs> } & CommonFilterDropdownProps>


const FILTER_DROPDOWN_CHECKBOX_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const getFilterIcon: FilterIconType = (filtered) => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />
export const getFilterValue: FilterValueType = (path, filters) => get(filters, path, null)

export const getTextFilterDropdown: GetTextFilterDropdownType = ({ containerStyles, inputProps } = {}) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setSelectedKeys('' as any)
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setSelectedKeys])

        const handleChangeInput: CustomInputProps['onChange'] = useCallback((event) => {
            setSelectedKeys(event.target.value as any)
            confirm({ closeDropdown: false })
        }, [confirm, setSelectedKeys])

        return (
            <FilterContainer
                clearFilters={handleClear}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                <Input
                    {...inputProps}
                    value={selectedKeys as any}
                    onChange={handleChangeInput}
                />
            </FilterContainer>
        )
    }
}

export const getOptionFilterDropdown: GetOptionFilterDropdownType = ({ containerStyles, checkboxGroupProps } = {}) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const { logEvent, getEventName } = useTracking()

        const eventName = getEventName(TrackingEventType.Checkbox)

        const options = useMemo(() => get(checkboxGroupProps, 'options'), [])

        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setSelectedKeys([])
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setSelectedKeys])

        const handleChange: CheckboxGroupProps['onChange'] = useCallback((values) => {
            let selectedValue = null
            if (isArray(options)) {
                selectedValue = checkboxGroupProps.options
                    .filter((option) => {
                        const optionValue = get(option, 'value')
                        return values.includes(optionValue)
                    })
                    .map((option) => get(option, 'label'))
                    .filter(Boolean)
            }
            if (!isEmpty(selectedValue)) {
                logEvent({
                    eventName,
                    eventProperties: {
                        component: {
                            id: checkboxGroupProps.id,
                            value: selectedValue,
                        },
                    },
                })
            }

            setSelectedKeys(values as React.Key[])
            confirm({ closeDropdown: false })
        }, [options, setSelectedKeys, confirm])

        return (
            <FilterContainer
                clearFilters={handleClear}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                <Checkbox.Group
                    {...checkboxGroupProps}
                    style={FILTER_DROPDOWN_CHECKBOX_STYLES}
                    value={selectedKeys}
                    onChange={handleChange}
                />
            </FilterContainer>
        )
    }
}

const DROPDOWN_SELECT_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const getSelectFilterDropdown = <ValueType extends SelectValueType>({ selectProps, containerStyles }: GetSelectFilterDropdownProps<ValueType> = {}): ReturnType<GetSelectFilterDropdownType<ValueType>> => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setSelectedKeys([])
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setSelectedKeys])

        const handleChange: CustomSelectProps<ValueType>['onChange'] = useCallback((value) => {
            setSelectedKeys(value as any)
            confirm({ closeDropdown: false })
        }, [confirm, setSelectedKeys])

        return (
            <SelectFilterContainer
                clearFilters={handleClear}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                <Select
                    <ValueType>
                    showArrow
                    optionFilterProp='label'
                    {...selectProps}
                    style={DROPDOWN_SELECT_STYLE}
                    value={selectedKeys as any}
                    onChange={handleChange}
                />
            </SelectFilterContainer>
        )
    }
}

const GRAPHQL_SEARCH_INPUT_STYLE: CSSProperties = { width: '100%' }

export const getGQLSelectFilterDropdown: GetGQLSelectFilterDropdownType = ({ gqlSelectProps, containerStyles } = {}) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters, visible }) => {
        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setSelectedKeys('' as any)
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setSelectedKeys])

        const handleChange: ISearchInputProps['onChange'] = useCallback((value) => {
            setSelectedKeys(value as any)
            confirm({ closeDropdown: false })
        }, [confirm, setSelectedKeys])

        return (
            visible && (
                <SelectFilterContainer
                    clearFilters={handleClear}
                    showClearButton={selectedKeys && selectedKeys.length > 0}
                    style={containerStyles}
                >
                    <GraphQlSearchInput
                        showArrow
                        {...gqlSelectProps}
                        value={selectedKeys as any}
                        onChange={handleChange}
                        style={GRAPHQL_SEARCH_INPUT_STYLE}
                    />
                </SelectFilterContainer>
            )
        )
    }
}

export const getDateFilterDropdown: GetDateFilterDropdownType = ({ datePickerProps: outerPickerProps, containerStyles } = {}) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const innerPickerProps: PickerProps<Dayjs> = useMemo(() => ({
            value: undefined,
            onChange: value => {
                setSelectedKeys(value.toISOString() as any)
                confirm({ closeDropdown: true })
            },
            allowClear: false,
        }), [confirm, setSelectedKeys])

        if (selectedKeys && selectedKeys.length > 0) {
            innerPickerProps.value = dayjs(selectedKeys as any)
        }

        return (
            <FilterContainer clearFilters={clearFilters}
                style={containerStyles}
                showClearButton={selectedKeys && selectedKeys.length > 0}
            >
                <DatePicker {...outerPickerProps} {...innerPickerProps} />
            </FilterContainer>
        )
    }
}

export const getDateRangeFilterDropdown: GetDateRangeFilterDropdownType = ({ datePickerProps: outerPickerProps, containerStyles } = {}) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setSelectedKeys([])
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setSelectedKeys])

        const innerPickerProps: RangePickerProps<Dayjs> = useMemo(() => ({
            value: undefined,
            onChange: values => {
                setSelectedKeys([values[0].toISOString(), values[1].toISOString()])
                confirm({ closeDropdown: true })
            },
            allowClear: false,
        }), [confirm, setSelectedKeys])

        if (selectedKeys && selectedKeys.length > 0) {
            innerPickerProps.value = [dayjs(selectedKeys[0]), dayjs(selectedKeys[1])]
        }

        return (
            <FilterContainer clearFilters={handleClear}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                <DateRangePicker  {...outerPickerProps} {...innerPickerProps} />
            </FilterContainer>
        )
    }
}

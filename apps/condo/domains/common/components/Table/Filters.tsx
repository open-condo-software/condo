import { FilterFilled } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Space } from 'antd'
import { CheckboxGroupProps } from 'antd/es/checkbox/Group'
import { PickerProps, RangePickerProps } from 'antd/es/date-picker/generatePicker'
import { FilterValue, FilterDropdownProps } from 'antd/es/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isFunction from 'lodash/isFunction'
import React, { CSSProperties, useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input, { InputProps } from '@condo/domains/common/components/antd/Input'
import Select, { CustomSelectProps, SelectValueType } from '@condo/domains/common/components/antd/Select'
import { GraphQlSearchInput, ISearchInputProps } from '@condo/domains/common/components/GraphQlSearchInput'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { colors } from '@condo/domains/common/constants/style'
import { QueryArgType } from '@condo/domains/common/utils/tables.utils'

import { Button } from '../Button'


type FilterIconType = (filtered?: boolean) => React.ReactNode
type FilterValueType = (path: string | Array<string>, filters: { [x: string]: QueryArgType }) => FilterValue

type CommonFilterDropdownProps = { containerStyles?: CSSProperties }
type GetCommonFilterDropdownType<P> = (props?: P) => (props: FilterDropdownProps) => React.ReactNode

type GetTextFilterDropdownType = GetCommonFilterDropdownType<{ inputProps?: InputProps } & CommonFilterDropdownProps>

type GetOptionFilterDropdownType = GetCommonFilterDropdownType<{ checkboxGroupProps?: CheckboxGroupProps & { id?: string } } & CommonFilterDropdownProps>

type GetSelectFilterDropdownProps<ValueType> = { selectProps?: CustomSelectProps<ValueType> } & CommonFilterDropdownProps
type GetSelectFilterDropdownType<ValueType> = GetCommonFilterDropdownType<GetSelectFilterDropdownProps<ValueType>>

type GetGQLSelectFilterDropdownType = GetCommonFilterDropdownType<{ gqlSelectProps?: ISearchInputProps } & CommonFilterDropdownProps>

type GetDateFilterDropdownType = GetCommonFilterDropdownType<{ datePickerProps?: PickerProps<Dayjs> } & CommonFilterDropdownProps>

type GetDateRangeFilterDropdownType = GetCommonFilterDropdownType<{
    Component?: React.FC
    datePickerProps?: RangePickerProps<Dayjs>
} & CommonFilterDropdownProps>

interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
    style?: CSSProperties
}

const FILTER_CONTAINER_STYLES: CSSProperties = { padding: 16 }

const handleStopPropagation = (e) => e.stopPropagation()

const FilterContainer: React.FC<React.PropsWithChildren<IFilterContainerProps>> = (props) => {
    const { showClearButton, clearFilters, children } = props
    const intl = useIntl()
    const ResetLabel = intl.formatMessage({ id: 'filters.Reset' })

    return (
        <div style={FILTER_CONTAINER_STYLES} onKeyDown={handleStopPropagation}>
            <Space size={8} direction='vertical' align='center'>
                {children}
                {
                    showClearButton && (
                        <Button
                            size='small'
                            onClick={clearFilters}
                            type='inlineLink'
                        >
                            {ResetLabel}
                        </Button>
                    )
                }
            </Space>
        </div>
    )
}

const StyledSelectFilterContainer = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 300px;
`

const SelectFilterContainer: React.FC<React.PropsWithChildren<IFilterContainerProps>> = (props) => {
    const { showClearButton, clearFilters, style, children } = props
    const intl = useIntl()
    const ResetLabel = intl.formatMessage({ id: 'filters.Reset' })

    return (
        <StyledSelectFilterContainer style={style} onKeyDown={handleStopPropagation}>
            {children}
            {
                showClearButton && (
                    <Button
                        size='small'
                        onClick={clearFilters}
                        type='inlineLink'
                    >
                        {ResetLabel}
                    </Button>
                )
            }
        </StyledSelectFilterContainer>
    )
}


const FILTER_DROPDOWN_CHECKBOX_STYLES: CSSProperties = { display: 'flex', flexDirection: 'column' }

export const getFilterIcon: FilterIconType = (filtered) => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />
export const getFilterValue: FilterValueType = (path, filters) => get(filters, path, null)

export const getTextFilterDropdown: GetTextFilterDropdownType = ({ containerStyles, inputProps } = {}) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {

        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            // NOTE: Type casting problem
            //
            // The current filtering in the condo table is designed in such a way that you need to be able
            // to pass a string in order for the search to work correctly.
            // If this is not done, then we will not be able to search by strings
            //
            // The implementation of the ant table does not provide for this possibility, but it works correctly
            //
            // If at one "perfect" moment something breaks, then most likely the problem is precisely in this
            //
            // This applies to all subsequent "@ts-ignore"
            // @ts-ignore
            setSelectedKeys('')
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setSelectedKeys])

        const handleChangeInput: InputProps['onChange'] = useCallback((event) => {
            // NOTE: Type casting problem
            // @ts-ignore
            setSelectedKeys(event.target.value)
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
                    // NOTE: Type casting problem
                    // @ts-ignore
                    value={selectedKeys}
                    onChange={handleChangeInput}
                />
            </FilterContainer>
        )
    }
}

export const getOptionFilterDropdown: GetOptionFilterDropdownType = ({ containerStyles, checkboxGroupProps } = {}) => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {

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
                    value={selectedKeys.map(key => String(key))}
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

        const handleChange: CustomSelectProps<ValueType>['onChange'] = useCallback((value, opt) => {
            // NOTE: Type casting problem
            // @ts-ignore
            setSelectedKeys(value)
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
                    // NOTE: Type casting problem
                    // @ts-ignore
                    value={selectedKeys}
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
            // NOTE: Type casting problem
            // @ts-ignore
            setSelectedKeys('')
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setSelectedKeys])

        const handleChange: ISearchInputProps['onChange'] = useCallback((value) => {
            // NOTE: Type casting problem
            // @ts-ignore
            setSelectedKeys(value)
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
                        // NOTE: Type casting problem
                        // @ts-ignore
                        value={selectedKeys}
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
                // NOTE: Type casting problem
                // @ts-ignore
                setSelectedKeys(value.toISOString())
                confirm({ closeDropdown: true })
            },
            allowClear: false,
        }), [confirm, setSelectedKeys])

        if (selectedKeys && selectedKeys.length > 0) {
            // NOTE: Type casting problem
            // @ts-ignore
            innerPickerProps.value = dayjs(selectedKeys)
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

export const getDateRangeFilterDropdown: GetDateRangeFilterDropdownType = ({ Component, datePickerProps: outerPickerProps, containerStyles } = {}) => {
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
            innerPickerProps.value = [dayjs(String(selectedKeys[0])), dayjs(String(selectedKeys[1]))]
        }

        return (
            <FilterContainer clearFilters={handleClear}
                showClearButton={selectedKeys && selectedKeys.length > 0}
                style={containerStyles}
            >
                {
                    Component ? <Component /> :
                        <DateRangePicker {...outerPickerProps} {...innerPickerProps} />
                }
            </FilterContainer>
        )
    }
}

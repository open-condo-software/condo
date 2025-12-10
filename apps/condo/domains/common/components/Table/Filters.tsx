import { FilterFilled } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Space } from 'antd'
import { CheckboxGroupProps } from 'antd/es/checkbox/Group'
import { PickerProps, RangePickerProps } from 'antd/es/date-picker/generatePicker'
import { FilterValue, FilterDropdownProps } from 'antd/es/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { CSSProperties, useCallback, useEffect, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import {
    Select,
    Input,
    InputProps,
    SelectProps,
    CheckboxProps,
    FilterComponent,
    FilterComponentProps,
} from '@open-condo/ui'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import AntInput, { InputProps as AntInputProps } from '@condo/domains/common/components/antd/Input'
import AntSelect, { CustomSelectProps as AntCustomSelectProps, SelectValueType as AntSelectValueType } from '@condo/domains/common/components/antd/Select'
import { GraphQlSearchInput, ISearchInputProps } from '@condo/domains/common/components/GraphQlSearchInput'
import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'
import DateRangePicker from '@condo/domains/common/components/Pickers/DateRangePicker'
import { colors } from '@condo/domains/common/constants/style'
import { QueryArgType, OptionType } from '@condo/domains/common/utils/tables.utils'

import { Button } from '../Button'



type FilterIconType = (filtered?: boolean) => React.ReactNode
type FilterValueType = (path: string | Array<string>, filters: { [x: string]: QueryArgType }) => FilterValue

type CommonFilterDropdownProps = { containerStyles?: CSSProperties }
type GetCommonFilterDropdownType<P> = (props?: P) => (props: FilterDropdownProps) => React.ReactNode
type GetCommonFilterComponentType<P> = (props?: P) => FilterComponent

type GetTextFilterDropdownType = GetCommonFilterDropdownType<{ inputProps?: AntInputProps } & CommonFilterDropdownProps>
type GetTextFilterComponentType = GetCommonFilterComponentType<{ inputProps?: InputProps }>

type GetOptionFilterDropdownType = GetCommonFilterDropdownType<{ checkboxGroupProps?: CheckboxGroupProps & { id?: string } } & CommonFilterDropdownProps>
type GetCheckboxGroupFilterComponentType = GetCommonFilterComponentType<{ checkboxGroupProps?: CheckboxProps & { id?: string, options?: OptionType[] } }>

type GetSelectFilterDropdownProps<ValueType> = { selectProps?: AntCustomSelectProps<ValueType> } & CommonFilterDropdownProps
type GetSelectFilterDropdownType<ValueType> = GetCommonFilterDropdownType<GetSelectFilterDropdownProps<ValueType>>
type GetSelectFilterComponentType = GetCommonFilterComponentType<{ selectProps?: Omit<SelectProps, 'value' | 'onChange' | 'defaultValue'> }>

type GetGQLSelectFilterDropdownType = GetCommonFilterDropdownType<{ gqlSelectProps?: ISearchInputProps } & CommonFilterDropdownProps>
type GetGQLSelectFilterComponentType = GetCommonFilterComponentType<{ gqlSelectProps?: ISearchInputProps }>

type GetDateFilterDropdownType = GetCommonFilterDropdownType<{ datePickerProps?: PickerProps<Dayjs> } & CommonFilterDropdownProps>
type GetDateFilterComponentType = GetCommonFilterComponentType<{ datePickerProps?: PickerProps<Dayjs> }>

type GetDateRangeFilterDropdownType = GetCommonFilterDropdownType<{
    Component?: React.FC
    datePickerProps?: RangePickerProps<Dayjs>
} & CommonFilterDropdownProps>
type GetDateRangeFilterComponentType = GetCommonFilterComponentType<{ datePickerProps?: RangePickerProps<Dayjs> }>

interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
    style?: CSSProperties
}

const FILTER_CONTAINER_STYLES: CSSProperties = { padding: 16 }
const FILTER_COMPONENT_BASE_CONTAINER_STYLE: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
}
const FILTER_COMPONENT_GQL_SELECT_CONTAINER_STYLE: CSSProperties = {
    ...FILTER_COMPONENT_BASE_CONTAINER_STYLE,
    width: '400px',
}

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


export const getFilterIcon: FilterIconType = (filtered) => <FilterFilled style={{ color: filtered ? colors.sberPrimary[5] : undefined }} />
export const getFilterValue: FilterValueType = (path, filters) => get(filters, path, null)

/**
 * @deprecated use getTextFilterComponent
 */
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
                <AntInput
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

export const getTextFilterComponent: GetTextFilterComponentType = ({ inputProps } = {}) => {
    const TextFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        setShowResetButton,
    }: FilterComponentProps) => {

        useEffect(() => {
            setShowResetButton(typeof filterValue === 'string' && filterValue.trim() !== '')
        }, [filterValue, setShowResetButton])

        const handleChangeInput: InputProps['onChange'] = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterValue(event.target.value)
            confirm({ closeDropdown: false })
        }, [confirm, setFilterValue])

        const inputValue = typeof filterValue === 'string' ? filterValue : ''

        return (
            <Input
                {...inputProps}
                value={inputValue}
                onChange={handleChangeInput}
            />
        )
    }

    return TextFilterDropdown
}

/**
 * @deprecated use getCheckboxGroupFilterComponent
 */
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
                    style={FILTER_COMPONENT_BASE_CONTAINER_STYLE}
                    value={selectedKeys.map(key => String(key))}
                    onChange={handleChange}
                />
            </FilterContainer>
        )
    }
}

export const getCheckboxGroupFilterComponent: GetCheckboxGroupFilterComponentType = ({ checkboxGroupProps } = {}) => {
    const CheckboxGroupFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        setShowResetButton,
    }: FilterComponentProps) => {

        useEffect(() => {
            setShowResetButton(Array.isArray(filterValue) && filterValue.length > 0)
        }, [filterValue, setShowResetButton])

        const handleChangeCheckboxGroup = useCallback((checked: Array<string | number | boolean>) => {
            const keys = checked.filter((v): v is string | number => typeof v !== 'boolean')
            setFilterValue(keys as React.Key[])
            confirm({ closeDropdown: false })
        }, [setFilterValue, confirm])

        const checkboxGroupValue = (Array.isArray(filterValue) ? filterValue : []).map(String)

        return (
            <Checkbox.Group
                {...checkboxGroupProps}
                style={FILTER_COMPONENT_BASE_CONTAINER_STYLE}
                value={checkboxGroupValue}
                onChange={handleChangeCheckboxGroup}
            />
        )
    }

    return CheckboxGroupFilterDropdown
}

/**
 * @deprecated use getSelectFilterComponent
 */
export const getSelectFilterDropdown = <ValueType extends AntSelectValueType>({ selectProps, containerStyles }: GetSelectFilterDropdownProps<ValueType> = {}): ReturnType<GetSelectFilterDropdownType<ValueType>> => {
    return ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => {
        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setSelectedKeys([])
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setSelectedKeys])

        const handleChange: AntCustomSelectProps<ValueType>['onChange'] = useCallback((value, opt) => {
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
                <AntSelect
                    <ValueType>
                    showArrow
                    optionFilterProp='label'
                    {...selectProps}
                    style={FILTER_COMPONENT_BASE_CONTAINER_STYLE}
                    // NOTE: Type casting problem
                    // @ts-ignore
                    value={selectedKeys}
                    onChange={handleChange}
                />
            </SelectFilterContainer>
        )
    }
}

export const getSelectFilterComponent: GetSelectFilterComponentType = ({ selectProps } = {}) => {
    const SelectFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        setShowResetButton,
    }: FilterComponentProps) => {
        const { mode, options, ...restSelectProps } = selectProps || {}

        useEffect(() => {
            setShowResetButton(!isEmpty(filterValue) || (isArray(filterValue) && filterValue.length > 0))
        }, [filterValue, setShowResetButton])

        const handleChangeSelect = useCallback<NonNullable<SelectProps['onChange']>>((value)  => {
            setFilterValue(value)
            confirm({ closeDropdown: false })
        }, [confirm, setFilterValue])

        let selectValue = undefined
        if (Array.isArray(filterValue)) {
            selectValue = filterValue
        } else if (typeof filterValue === 'string' || typeof filterValue === 'number') {
            selectValue = [filterValue]
        }

        return (
            <Select
                {...restSelectProps}
                options={options}
                mode={mode}
                showArrow
                optionFilterProp='label'
                value={selectValue}
                onChange={handleChangeSelect}
            />
        )
    }

    return SelectFilterDropdown
}

/**
 * @deprecated use getGQLSelectFilterComponent
 */
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
                    />
                </SelectFilterContainer>
            )
        )
    }
}

export const getGQLSelectFilterComponent: GetGQLSelectFilterComponentType = ({ gqlSelectProps } = {}) => {
    const GQLSelectFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        setShowResetButton,
    }: FilterComponentProps) => {
        
        useEffect(() => {
            setShowResetButton(Array.isArray(filterValue) && filterValue.length > 0)
        }, [filterValue, setShowResetButton])

        const handleChangeGQLSelect = useCallback<NonNullable<SelectProps['onChange']>>((value)  => {
            setFilterValue(value)
            confirm({ closeDropdown: false })
        }, [confirm, setFilterValue])

        let gqlSelectValue = undefined
        if (Array.isArray(filterValue)) {
            gqlSelectValue = filterValue
        } else if (typeof filterValue === 'string' || typeof filterValue === 'number') {
            gqlSelectValue = [filterValue]
        }

        return (
            <GraphQlSearchInput
                showArrow
                style={FILTER_COMPONENT_GQL_SELECT_CONTAINER_STYLE}
                {...gqlSelectProps}
                value={gqlSelectValue}
                onChange={handleChangeGQLSelect}
            />
        )
    }

    return GQLSelectFilterDropdown
}

/**
 * @deprecated use getDateFilterComponent
 */
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

export const getDateFilterComponent: GetDateFilterComponentType = ({ datePickerProps: outerPickerProps } = {}) => {
    const DateFilterComponent = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        setShowResetButton,
    }: FilterComponentProps) => {
        useEffect(() => {
            setShowResetButton(typeof filterValue === 'string' && filterValue.trim() !== '')
        }, [filterValue, setShowResetButton])

        const innerPickerProps: PickerProps<Dayjs> = useMemo(() => ({
            value: undefined,
            onChange: value => {
                setFilterValue(value.toISOString())
                confirm({ closeDropdown: true })
            },
            allowClear: false,
        }), [confirm, setFilterValue])

        if (typeof filterValue === 'string' && filterValue.trim() !== '') {
            innerPickerProps.value = dayjs(String(filterValue))
        }

        return (
            <DatePicker {...outerPickerProps} {...innerPickerProps} />
        )
    }

    return DateFilterComponent
}


/**
 * @deprecated use getDateRangeFilterComponent
 */
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

export const getDateRangeFilterComponent: GetDateRangeFilterComponentType = ({ datePickerProps: outerPickerProps } = {}) => {
    const DateRangeFilterComponent = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        setShowResetButton,
    }: FilterComponentProps) => {
        useEffect(() => {
            setShowResetButton(Array.isArray(filterValue) && filterValue.length > 0)
        }, [filterValue, setShowResetButton])

        const innerPickerProps: RangePickerProps<Dayjs> = useMemo(() => ({
            value: undefined,
            onChange: values => {
                setFilterValue([values[0].toISOString(), values[1].toISOString()])
                confirm({ closeDropdown: true })
            },
            allowClear: false,
        }), [confirm, setFilterValue])

        if (Array.isArray(filterValue) && filterValue.length > 0) {
            innerPickerProps.value = [dayjs(String(filterValue[0])), dayjs(String(filterValue[1]))]
        }

        return (
            <DateRangePicker {...outerPickerProps} {...innerPickerProps} />
        )
    }

    return DateRangeFilterComponent
}

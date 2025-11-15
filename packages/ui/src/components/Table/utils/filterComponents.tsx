import isFunction from 'lodash/isFunction'
import React, { CSSProperties, useCallback } from 'react'

import { 
    Space, 
    Checkbox, 
    Input, 
    InputProps,
    Select, 
    Button,
    FilterComponentProps,
    SelectProps,
    CheckboxProps,
} from '@open-condo/ui/src'
import type { FilterConfig, FilterComponent } from '@open-condo/ui/src/components/Table/types'

export type TextFilterDropdownType = { inputProps?: InputProps }
export type CheckboxGroupFilterDropdownType = { checkboxGroupProps?: CheckboxProps & { id?: string } }
export type SelectFilterDropdownType = { selectProps?: SelectProps }

type GetCommonFilterDropdownType<P> = (props: P) => FilterComponent
type FilterByKey = (filterConfig: FilterConfig) => FilterComponent | undefined

type GetTextFilterDropdownType = GetCommonFilterDropdownType<TextFilterDropdownType>
type GetCheckboxGroupFilterDropdownType = GetCommonFilterDropdownType<CheckboxGroupFilterDropdownType>
type GetSelectFilterDropdownType = GetCommonFilterDropdownType<SelectFilterDropdownType>


interface IFilterContainerProps {
    clearFilters: () => void
    showClearButton?: boolean
    style?: CSSProperties
}

const FilterContainer: React.FC<React.PropsWithChildren<IFilterContainerProps>> = (props) => {
    const { showClearButton, clearFilters, children } = props

    return (
        <Space size={8} direction='vertical' align='center'>
            {children}
            {
                showClearButton && (
                    <Button
                        onClick={clearFilters}
                        type='accent'
                    >
                        Reset
                    </Button>
                )
            }
        </Space>
    )
}
FilterContainer.displayName = 'FilterContainer'

const getTextFilterDropdown: GetTextFilterDropdownType = ({ inputProps } = {}) => {
    const TextFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        clearFilters,
    }: FilterComponentProps) => {

        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setFilterValue('')
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setFilterValue])

        const handleChangeInput: InputProps['onChange'] = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterValue(event.target.value)
            confirm({ closeDropdown: false })
        }, [confirm, setFilterValue])

        return (
            <FilterContainer
                clearFilters={handleClear}
                showClearButton={
                    (Array.isArray(filterValue) && filterValue.length > 0) ||
                    (!Array.isArray(filterValue) && filterValue !== '' && filterValue !== null && filterValue !== undefined)
                }
            >
                <Input
                    {...inputProps}
                    value={typeof filterValue === 'string' ? filterValue : ''}
                    onChange={handleChangeInput}
                />
            </FilterContainer>
        )
    }

    return TextFilterDropdown
}

const getCheckboxGroupFilterDropdown: GetCheckboxGroupFilterDropdownType = ({ checkboxGroupProps } = {}) => {
    const CheckboxGroupFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        clearFilters,
    }: FilterComponentProps) => {

        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setFilterValue([])
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setFilterValue])

        const handleChange = useCallback((checked: Array<string | number | boolean>) => {
            const keys = checked.filter((v): v is string | number => typeof v !== 'boolean')
            setFilterValue(keys as React.Key[])
            confirm({ closeDropdown: false })
        }, [setFilterValue, confirm])

        return (
            <FilterContainer
                clearFilters={handleClear}
                showClearButton={Array.isArray(filterValue) && filterValue.length > 0}
            >
                <Checkbox.Group
                    {...checkboxGroupProps}
                    value={(Array.isArray(filterValue) ? filterValue : []).map(key => String(key))}
                    onChange={handleChange}
                />
            </FilterContainer>
        )
    }

    return CheckboxGroupFilterDropdown
}

const getSelectFilterDropdown: GetSelectFilterDropdownType = ({ selectProps }) => {
    const SelectFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        clearFilters,
    }: FilterComponentProps) => {

        const valueForSelect: SelectProps['value'] =
            Array.isArray(filterValue)
                ? filterValue
                : undefined

        const multipleValueForSelecet: SelectProps['value'] =
        typeof filterValue === 'string' || typeof filterValue === 'number'
            ? filterValue
            : undefined
        
        const handleClear = useCallback(() => {
            isFunction(clearFilters) && clearFilters()
            setFilterValue([])
            confirm({ closeDropdown: true })
        }, [clearFilters, confirm, setFilterValue])

        const handleChange = useCallback<NonNullable<SelectProps['onChange']>>((value)  => {
            setFilterValue(value)
            confirm({ closeDropdown: false })
        }, [confirm, setFilterValue])

        return (
            <FilterContainer
                clearFilters={handleClear}
                showClearButton={
                    (Array.isArray(filterValue) && filterValue.length > 0) ||
                    (!Array.isArray(filterValue) && filterValue !== '' && filterValue !== null && filterValue !== undefined)
                }
            >
                {
                    selectProps?.mode === 'multiple' ?
                        <Select
                            {...selectProps}
                            options={selectProps?.options || []}
                            showArrow
                            optionFilterProp='label'
                            mode='multiple'
                            value={valueForSelect}
                            onChange={handleChange}
                        /> 
                        :
                        <Select
                            {...selectProps}   
                            showArrow
                            options={selectProps?.options || []}
                            optionFilterProp='label'
                            value={multipleValueForSelecet}
                            onChange={handleChange}
                        /> 
                }
            </FilterContainer>
        )
    }

    return SelectFilterDropdown
}

const mapper = {
    textColumnFilter: getTextFilterDropdown,
    selectColumnFilter: getSelectFilterDropdown,
    checkboxGroupColumnFilter: getCheckboxGroupFilterDropdown,
}

export const getFilterByKey: FilterByKey = ({ key, componentProps = {} }) => {
    const getComponent = mapper[key]
    if (getComponent) return getComponent(componentProps)

    return undefined
}

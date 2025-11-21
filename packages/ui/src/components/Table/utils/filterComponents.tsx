import React, { useCallback, useEffect } from 'react'

import { 
    Checkbox, 
    Input, 
    InputProps,
    Select, 
    FilterComponentProps,
    SelectProps,
    CheckboxProps,
    TableColumn,
} from '@open-condo/ui/src'
import type { FilterComponent, FilterConfig } from '@open-condo/ui/src/components/Table/types'

type OptionType = {
    label: string
    value: string
}

const TextColumnFilterKey = 'textColumnFilter'
const CheckboxGroupColumnFilterKey = 'checkboxGroupColumnFilter'
const SelectColumnFilterKey = 'selectColumnFilter'

enum ComponentType {
    Input = TextColumnFilterKey,
    CheckboxGroup = CheckboxGroupColumnFilterKey,
    Select = SelectColumnFilterKey,
}

export type TextColumnFilterConfig = {
    key: typeof TextColumnFilterKey
    componentProps?: TextFilterComponentType
}

export type SelectColumnFilterConfig = {
    key: typeof SelectColumnFilterKey
    options: OptionType[]
    componentProps?: SelectFilterComponentType
}

export type CheckboxGroupColumnFilterConfig = {
    key: typeof CheckboxGroupColumnFilterKey
    options: OptionType[]
    componentProps?: CheckboxGroupFilterComponentType
}

type TextFilterComponentType = { inputProps?: InputProps }
type CheckboxGroupFilterComponentType = { checkboxGroupProps?: CheckboxProps & { options?: OptionType[] } }
type SelectFilterComponentType = { selectProps?: SelectProps }

type GetCommonFilterComponentType<P> = (props: P) => FilterComponent

type GetTextFilterComponentType = GetCommonFilterComponentType<TextFilterComponentType>
type GetCheckboxGroupFilterComponentType = GetCommonFilterComponentType<CheckboxGroupFilterComponentType>
type GetSelectFilterComponentType = GetCommonFilterComponentType<SelectFilterComponentType>


const getTextFilterDropdown: GetTextFilterComponentType = ({ inputProps }: TextFilterComponentType = {}) => {
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

        return (
            <Input
                {...inputProps}
                value={typeof filterValue === 'string' ? filterValue : ''}
                onChange={handleChangeInput}
            />
        )
    }

    return TextFilterDropdown
}

const getCheckboxGroupFilterDropdown: GetCheckboxGroupFilterComponentType = ({ checkboxGroupProps }: CheckboxGroupFilterComponentType = {}) => {
    const CheckboxGroupFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        setShowResetButton,
    }: FilterComponentProps) => {

        useEffect(() => {
            setShowResetButton(Array.isArray(filterValue) && filterValue.length > 0)
        }, [filterValue, setShowResetButton])

        const handleChange = useCallback((checked: Array<string | number | boolean>) => {
            const keys = checked.filter((v): v is string | number => typeof v !== 'boolean')
            setFilterValue(keys as React.Key[])
            confirm({ closeDropdown: false })
        }, [setFilterValue, confirm])

        return (
            <Checkbox.Group
                {...checkboxGroupProps}
                value={(Array.isArray(filterValue) ? filterValue : []).map(key => String(key))}
                onChange={handleChange}
            >
                {checkboxGroupProps?.options?.map((option: OptionType) => (
                    <Checkbox key={option.value} value={option.value}>
                        {option.label}
                    </Checkbox>
                ))}
            </Checkbox.Group>
        )
    }

    return CheckboxGroupFilterDropdown
}

const getSelectFilterDropdown: GetSelectFilterComponentType = ({ selectProps }: SelectFilterComponentType = {}) => {
    const SelectFilterDropdown = ({ 
        setFilterValue, 
        filterValue, 
        confirm, 
        setShowResetButton,
    }: FilterComponentProps) => {

        useEffect(() => {
            setShowResetButton(Array.isArray(filterValue) && filterValue.length > 0)
        }, [filterValue, setShowResetButton])

        const valueForSelect: SelectProps['value'] =
            Array.isArray(filterValue)
                ? filterValue
                : undefined

        const singleValueForSelect: SelectProps['value'] =
            typeof filterValue === 'string' || typeof filterValue === 'number'
                ? filterValue
                : undefined

        const handleChange = useCallback<NonNullable<SelectProps['onChange']>>((value)  => {
            setFilterValue(value)
            confirm({ closeDropdown: false })
        }, [confirm, setFilterValue])

        const safeSelectProps = (selectProps || {}) as SelectProps

        return (
            <>
                {
                    selectProps?.mode === 'multiple' ?
                        <Select
                            {...safeSelectProps}
                            options={safeSelectProps?.options || []}
                            showArrow
                            optionFilterProp='label'
                            mode='multiple'
                            value={valueForSelect as (string | number)[] | undefined}
                            onChange={handleChange}
                        /> 
                        :
                        <Select
                            {...(safeSelectProps as Omit<SelectProps, 'mode'>)}   
                            showArrow
                            options={safeSelectProps?.options || []}
                            optionFilterProp='label'
                            value={singleValueForSelect}
                            onChange={handleChange}
                        /> 
                }
            </>
        )
    }

    return SelectFilterDropdown
}

export function getFilterComponentByKey (
    filterConfig: FilterConfig
): TableColumn['filterComponent'] {
    const componentPropsWithId = filterConfig?.componentProps as { id?: string } | undefined
    const id = componentPropsWithId?.id || `${filterConfig?.key}FilterComponent`

    switch (filterConfig?.key) {
        case ComponentType.Input: {
            const inputProps = filterConfig?.componentProps?.inputProps ?? {}
            const resolvedInputProps = {
                ...inputProps,
                id,
            }
            return getTextFilterDropdown({
                inputProps: resolvedInputProps,
            })
        }

        case ComponentType.Select: {
            const selectProps = filterConfig?.componentProps?.selectProps ?? {}
            const resolvedSelectProps = {
                ...selectProps,
                options: filterConfig?.options || [],
                id,
            }
            return getSelectFilterDropdown({
                selectProps: resolvedSelectProps,
            })
        }

        case ComponentType.CheckboxGroup: {
            const checkboxGroupProps = filterConfig?.componentProps?.checkboxGroupProps ?? {}
            return getCheckboxGroupFilterDropdown({
                checkboxGroupProps: {
                    ...checkboxGroupProps,
                    options: filterConfig?.options || [],
                    id,
                },
            })
        }

        default:
            return undefined
    }
}

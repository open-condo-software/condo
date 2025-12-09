import { FormInstance, SelectProps as AntSelectProps } from 'antd'
import { FormItemProps } from 'antd/es'
import { CheckboxChangeEvent, CheckboxGroupProps } from 'antd/es/checkbox'
import { RangePickerProps } from 'antd/lib/date-picker/generatePicker'
import { ColumnType } from 'antd/lib/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import React, { CSSProperties } from 'react'

import { 
    CheckboxProps, 
    InputProps,
    SelectProps,
    OptionsItem,
    FilterComponent,
    TableColumn,
} from '@open-condo/ui'

import { ISearchInputProps } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    getDateFilterDropdown,
    getDateRangeFilterDropdown,
    getGQLSelectFilterDropdown,
    getOptionFilterDropdown,
    getSelectFilterDropdown,
    getTextFilterDropdown,
    getTextFilterComponent,
    getCheckboxGroupFilterComponent,
    getSelectFilterComponent,
    getGQLSelectFilterComponent,
    getDateFilterComponent,
    getDateRangeFilterComponent,
} from '@condo/domains/common/components/Table/Filters'
import { FILTERS_POPUP_CONTAINER_ID } from '@condo/domains/common/constants/filters'

import { FiltersFromQueryType, OptionType, QueryMeta } from './tables.utils'

import { DatePickerType } from '../components/Pickers/DatePicker'

export enum FilterComponentSize {
    Small = 8,
    Medium = 12,
    MediumLarge = 16,
    Large = 24,
}

export enum ComponentType {
    Input,
    CheckboxGroup,
    Checkbox,
    Select,
    GQLSelect,
    TagsSelect,
    Date,
    DateRange,
    Custom,
}

type CommonFilterComponentType = {
    modalFilterComponentWrapper?: {
        label?: string
        size?: FilterComponentSize
        spaceSizeAfter?: FilterComponentSize
        formItemProps?: FormItemProps
    }
    columnFilterComponentWrapper?: CSSProperties
}

/**
 * @deprecated use GQLSelectFilterComponentType
 */
type GQLSelectFilterType = {
    type: ComponentType.GQLSelect
    props?: ISearchInputProps
}

type GQLSelectFilterComponentType = {
    type: ComponentType.GQLSelect
    props?: ISearchInputProps
}

/**
 * @deprecated use InputFilterComponentType
 */
type InputFilterType = {
    type: ComponentType.Input
    props?: InputProps
}

type InputFilterComponentType = {
    type: ComponentType.Input
    props?: InputProps
}

/**
 * @deprecated use CheckboxGroupFilterComponentType
 */
type CheckboxGroupFilterType = {
    type: ComponentType.CheckboxGroup
    options: OptionType[]
    props?: CheckboxGroupProps
}

type CheckboxGroupFilterComponentType = {
    type: ComponentType.CheckboxGroup
    options: OptionType[]
    props?: CheckboxGroupProps
}

/**
 * @deprecated use CheckboxFilterComponentType
 */
type CheckboxFilterType = {
    type: ComponentType.Checkbox
    props?: CheckboxProps
}

type CheckboxFilterComponentType = {
    type: ComponentType.Checkbox
    props?: CheckboxProps
}

/**
 * @deprecated use SelectFilterComponentType
 */
type SelectFilterType = {
    type: ComponentType.Select
    options: OptionType[]
    props?: AntSelectProps<string>
}

type SelectFilterComponentType = {
    type: ComponentType.Select
    options: OptionsItem[]
    props?: Omit<SelectProps, 'options' | 'value' | 'onChange' | 'defaultValue'>
}

/**
 * @deprecated use TagsSelectFilterComponentType
 */
type TagsSelectFilterType = {
    type: ComponentType.TagsSelect
    props?: AntSelectProps<string>
}

type TagsSelectFilterComponentType = {
    type: ComponentType.TagsSelect
    props?: Omit<SelectProps, 'value' | 'onChange' | 'defaultValue'>
}

/**
 * @deprecated use DateFilterComponentType
 */
type DateFilterType = {
    type: ComponentType.Date
    props?: DatePickerType
}

type DateFilterComponentType = {
    type: ComponentType.Date
    props?: DatePickerType
}

/**
 * @deprecated use DateRangeFilterComponentType
 */
type DateRangeFilterType = {
    type: ComponentType.DateRange
    props?: RangePickerProps<Dayjs>
}

type DateRangeFilterComponentType = {
    type: ComponentType.DateRange
    props?: RangePickerProps<Dayjs>
}

/**
 * @deprecated use CustomFilterComponentType
 */
type CustomFilterType<RecordType> = {
    type: ComponentType.Custom
    getComponentFilterDropdown?: ColumnType<RecordType>['filterDropdown']
    modalFilterComponent?: React.ReactElement | ((form: FormInstance) => React.ReactElement)
}

type CustomFilterComponentType = {
    type: ComponentType.Custom
    getFilterComponent?: FilterComponent
    modalFilterComponent?: React.ReactElement | ((form: FormInstance) => React.ReactElement)
}

/**
 * @deprecated use TableFilterComponentType
 */
export type FilterComponentType<RecordType = unknown> = CommonFilterComponentType & (
    GQLSelectFilterType | InputFilterType | CheckboxGroupFilterType | CheckboxFilterType | SelectFilterType |
    TagsSelectFilterType | DateFilterType | DateRangeFilterType | CustomFilterType<RecordType>
)

export type TableFilterComponentType = CommonFilterComponentType & (
    GQLSelectFilterComponentType | InputFilterComponentType | CheckboxGroupFilterComponentType | CheckboxFilterComponentType | SelectFilterComponentType |
    TagsSelectFilterComponentType | DateFilterComponentType | DateRangeFilterComponentType | CustomFilterComponentType
)

/**
 * @deprecated use nonTableCustomFilterComponentType
 */
export type nonCustomFilterComponentType = CommonFilterComponentType & (
    GQLSelectFilterType | InputFilterType | CheckboxGroupFilterType | CheckboxFilterType | SelectFilterType |
    TagsSelectFilterType | DateFilterType | DateRangeFilterType
)

export type nonTableCustomFilterComponentType = CommonFilterComponentType & Omit<TableFilterComponentType, ComponentType.Custom>

/**
 * @deprecated use TableFiltersMeta
 */
export type FiltersMeta<FilterType, RecordType = unknown> = QueryMeta<FilterType> & {
    component?: FilterComponentType<RecordType>
}

export type TableFiltersMeta<FilterType> = QueryMeta<FilterType> & {
    component?: TableFilterComponentType
}

export const getQueryToValueProcessorByType = (type: ComponentType) => {
    switch (type) {
        case ComponentType.Date:
            return value => dayjs(value)
        case ComponentType.DateRange:
            return value => value.map(date => dayjs(date))
        default: return
    }
}

const TAGS_SELECT_DROPDOWN_STYLE: CSSProperties = { display: 'none' }

/**
 * @deprecated use getFilterComponentByKey
 */
export function getFilterDropdownByKey <FilterType, RecordType> (filterMetas: Array<FiltersMeta<FilterType, RecordType>>, key: string): ColumnType<RecordType>['filterDropdown'] {
    const filterMeta = filterMetas.find(filterMeta => filterMeta.keyword === key)
    const component = get(filterMeta, 'component')
    const type = get(component, 'type')
    const props = get(component, 'props')
    const idFromProps = get(props, 'id')
    const columnFilterComponentWrapperStyles = get(component, 'columnFilterComponentWrapper')
    const id = idFromProps || `${key}FilterDropdown`

    switch (type) {
        case ComponentType.Input: {
            const placeholder = get(props, 'placeholder')

            return getTextFilterDropdown({
                inputProps: { placeholder, id },
                containerStyles: columnFilterComponentWrapperStyles,
            })
        }

        case ComponentType.Date:
            return getDateFilterDropdown({
                datePickerProps: { id },
                containerStyles: columnFilterComponentWrapperStyles,
            })

        case ComponentType.CheckboxGroup: {
            const options = get(component, 'options')
            const loading = get(component, 'props', 'loading')

            return getOptionFilterDropdown({
                checkboxGroupProps: {
                    options,
                    disabled: loading,
                    id,
                },
                containerStyles: columnFilterComponentWrapperStyles,
            })
        }

        case ComponentType.DateRange:
            return getDateRangeFilterDropdown({
                datePickerProps: { ...props, id },
                containerStyles: columnFilterComponentWrapperStyles,
            })

        case ComponentType.Select: {
            const options = get(component, 'options')
            const loading = get(component, 'loading')
            const props = get(component, 'props', {})

            return getSelectFilterDropdown({
                selectProps: { options, loading, ...props, id },
                containerStyles: columnFilterComponentWrapperStyles,
            })
        }

        case ComponentType.GQLSelect: {
            const props = get(component, 'props', {})
            const search = get(props, 'search')
            const mode = get(props, 'mode')

            return getGQLSelectFilterDropdown({
                gqlSelectProps: {
                    ...props,
                    search,
                    mode,
                    id,
                },
                containerStyles: columnFilterComponentWrapperStyles,
            })
        }

        case ComponentType.TagsSelect: {
            const props = get(component, 'props', {})

            return getSelectFilterDropdown({
                selectProps: {
                    mode: 'tags',
                    dropdownStyle: TAGS_SELECT_DROPDOWN_STYLE,
                    allowClear: true,
                    suffixIcon: null,
                    ...props,
                    id,
                },
                containerStyles: columnFilterComponentWrapperStyles,
            })
        }

        case ComponentType.Custom:
            return get(component, 'getComponentFilterDropdown')

        default: return
    }
}

export function getFilterComponentByKey <FilterType> (filterMetas: Array<TableFiltersMeta<FilterType>>, key: string): TableColumn['filterComponent'] {
    const filterMeta = filterMetas.find(meta => meta.keyword === key)
    const component = filterMeta?.component

    if (!component) return undefined

    let idFromProps: string | undefined
    if ('props' in component && component.props && typeof component.props === 'object') {
        idFromProps = 'id' in component.props ? component.props.id : undefined
    }
    const id = idFromProps || `${key}FilterComponent`

    switch (component.type) {
        case ComponentType.Input: {
            const inputProps = component?.props ?? {}

            return getTextFilterComponent({
                inputProps: {
                    ...inputProps,
                    id,
                },
            })
        }

        case ComponentType.CheckboxGroup: {
            const options = component.options ?? []
            const checkboxGroupProps = component?.props ?? {}
            type CheckboxGroupComponentProps = NonNullable<Parameters<typeof getCheckboxGroupFilterComponent>[0]>['checkboxGroupProps']

            const resolvedCheckboxGroupProps: CheckboxGroupComponentProps = {
                options,
                id,
                className: checkboxGroupProps.className,
                disabled: checkboxGroupProps.disabled,
                onChange: (e: CheckboxChangeEvent) => {
                    const keys = e.target.checked ? [e.target.value] : []
                    return keys as React.Key[]
                },
            }
            
            return getCheckboxGroupFilterComponent({
                checkboxGroupProps: resolvedCheckboxGroupProps,
            })
        }

        case ComponentType.Select: {
            const options = component.options ?? []
            const loading = component.props?.loading ?? false
            const selectProps = component?.props ?? {}

            return getSelectFilterComponent({
                selectProps: {
                    ...selectProps,
                    options,
                    loading,
                    id,
                },
            })
        }

        case ComponentType.Date: {
            const dateProps = component?.props ?? {}

            return getDateFilterComponent({ datePickerProps: { ...dateProps, id } })
        }

        case ComponentType.DateRange: {
            const dateRangeProps = component?.props ?? {}
            
            return getDateRangeFilterComponent({ datePickerProps: { ...dateRangeProps, id } })
        }

        case ComponentType.GQLSelect: {
            const props = component?.props
            const search = props?.search
            const mode = props?.mode

            return getGQLSelectFilterComponent({
                gqlSelectProps: {
                    ...props,
                    search,
                    mode,   
                    id,
                },
            })
        }

        case ComponentType.TagsSelect: {
            const props = component?.props ?? {}

            return getSelectFilterComponent({
                selectProps: {
                    mode: 'multiple',
                    options: [],
                    allowClear: true,
                    ...props,
                    id,
                },
            })
        }

        case ComponentType.Custom: {
            return component?.getFilterComponent
        }

        default:
            return undefined
    }
}

export function convertToOptions <
    TData extends Record<string, any>,
    TLabel extends keyof TData,
    TValue extends keyof TData,
> (
    objects: TData[],
    labelField: TData[TLabel] extends string ? TLabel : never,
    valueField: TData[TValue] extends string ? TValue : never,
): OptionType[] {
    return objects.map(object => {
        const label = get(object, labelField)
        const value = get(object, valueField)

        return { label, value }
    })
}

export function getFiltersQueryData (newFilters?: FiltersFromQueryType, sort?: string[], offset?: number) {
    const possibleFilters = pickBy(newFilters, (value) => !isEmpty(value))
    return { sort, offset, filters: possibleFilters }
}

export function getFiltersModalPopupContainer (): HTMLElement {
    return document.getElementById(FILTERS_POPUP_CONTAINER_ID)
}
import { FormInstance, SelectProps } from 'antd'
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
    SelectProps as OpenSelectProps,
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

type GQLSelectFilterType = {
    type: ComponentType.GQLSelect
    props?: ISearchInputProps
}

type OpenGQLSelectFilterType = {
    type: ComponentType.GQLSelect
    props?: ISearchInputProps
}

type InputFilterType = {
    type: ComponentType.Input
    props?: InputProps
}

type OpenInputFilterType = {
    type: ComponentType.Input
    props?: InputProps
}

type CheckboxGroupFilterType = {
    type: ComponentType.CheckboxGroup
    options: OptionType[]
    props?: CheckboxGroupProps
}

type OpenCheckboxGroupFilterType = {
    type: ComponentType.CheckboxGroup
    options: OptionType[]
    props?: CheckboxGroupProps
}

type CheckboxFilterType = {
    type: ComponentType.Checkbox
    props?: CheckboxProps
}

type OpenCheckboxFilterType = {
    type: ComponentType.Checkbox
    props?: CheckboxProps
}

type SelectFilterType = {
    type: ComponentType.Select
    options: OptionType[]
    props?: SelectProps<string>
}

type OpenSelectFilterType = {
    type: ComponentType.Select
    options: OptionsItem[]
    props?: Omit<OpenSelectProps, 'options' | 'value' | 'onChange' | 'defaultValue'>
}

type TagsSelectFilterType = {
    type: ComponentType.TagsSelect
    props?: SelectProps<string>
}

type OpenTagsSelectFilterType = {
    type: ComponentType.TagsSelect
    props?: SelectProps<string>
}

type DateFilterType = {
    type: ComponentType.Date
    props?: DatePickerType
}

type OpenDateFilterType = {
    type: ComponentType.Date
    props?: DatePickerType
}

type DateRangeFilterType = {
    type: ComponentType.DateRange
    props?: RangePickerProps<Dayjs>
}

type OpenDateRangeFilterType = {
    type: ComponentType.DateRange
    props?: RangePickerProps<Dayjs>
}

type CustomFilterType<RecordType> = {
    type: ComponentType.Custom
    getComponentFilterDropdown?: ColumnType<RecordType>['filterDropdown']
    modalFilterComponent?: React.ReactElement | ((form: FormInstance) => React.ReactElement)
}

type OpenCustomFilterType = {
    type: ComponentType.Custom
    getFilterComponent?: FilterComponent
    modalFilterComponent?: React.ReactElement | ((form: FormInstance) => React.ReactElement)
}

export type FilterComponentType<RecordType = unknown> = CommonFilterComponentType & (
    GQLSelectFilterType | InputFilterType | CheckboxGroupFilterType | CheckboxFilterType | SelectFilterType |
    TagsSelectFilterType | DateFilterType | DateRangeFilterType | CustomFilterType<RecordType>
)

export type OpenFilterComponentType = CommonFilterComponentType & (
    OpenGQLSelectFilterType | OpenInputFilterType | OpenCheckboxGroupFilterType | OpenCheckboxFilterType | OpenSelectFilterType |
    OpenTagsSelectFilterType | OpenDateFilterType | OpenDateRangeFilterType | OpenCustomFilterType
)

export type nonCustomFilterComponentType = CommonFilterComponentType & (
    GQLSelectFilterType | InputFilterType | CheckboxGroupFilterType | CheckboxFilterType | SelectFilterType |
    TagsSelectFilterType | DateFilterType | DateRangeFilterType
)

export type nonOpenCustomFilterComponentType = CommonFilterComponentType & Omit<OpenFilterComponentType, ComponentType.Custom>

export type FiltersMeta<FilterType, RecordType = unknown> = QueryMeta<FilterType> & {
    component?: FilterComponentType<RecordType>
}

export type OpenFiltersMeta<FilterType> = QueryMeta<FilterType> & {
    component?: OpenFilterComponentType
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

export function getFilterComponentByKey <FilterType> (filterMetas: Array<OpenFiltersMeta<FilterType>>, key: string): TableColumn['filterComponent'] {
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
            return getTextFilterComponent({
                inputProps: {
                    ...(component.props ?? {}),
                    id,
                },
            })
        }

        case ComponentType.CheckboxGroup: {
            const options = component.options ?? []
            const checkboxGroupPropsFromMeta = component.props ?? {}
            type CheckboxGroupComponentProps = NonNullable<Parameters<typeof getCheckboxGroupFilterComponent>[0]>['checkboxGroupProps']

            const resolvedCheckboxGroupProps: CheckboxGroupComponentProps = {
                options,
                id,
                className: checkboxGroupPropsFromMeta.className,
                disabled: checkboxGroupPropsFromMeta.disabled,
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
            const selectProps = component.props ?? {}

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
            const props = component?.props ?? {}

            return getDateFilterComponent({ datePickerProps: { ...props, id } })
        }

        case ComponentType.DateRange: {
            const props = component?.props ?? {}
            
            return getDateRangeFilterComponent({ datePickerProps: { ...props, id } })
        }

        case ComponentType.GQLSelect: {
            const props = component?.props
            const search = props?.search
            const mode = props?.mode
            const columnFilterComponentWrapperStyles = component?.columnFilterComponentWrapper

            return getGQLSelectFilterComponent({
                containerStyles: columnFilterComponentWrapperStyles,
                gqlSelectProps: {
                    ...props,
                    search,
                    mode,   
                    id,
                },
            })
        }

        case ComponentType.TagsSelect: {
            const props = get(component, 'props', {})
            const columnFilterComponentWrapperStyles = get(component, 'columnFilterComponentWrapper')

            const oldFilterDropdown = getSelectFilterDropdown({
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

            // TODO: Migrate from getSelectFilterDropdown to getSelectFilterComponent
            return (newProps) => {
                const { setFilterValue, filterValue, confirm, clearFilters } = newProps
                return oldFilterDropdown({
                    setSelectedKeys: setFilterValue,
                    selectedKeys: Array.isArray(filterValue) ? filterValue : filterValue ? [filterValue] : [],
                    confirm,
                    clearFilters,
                    visible: true,
                    close: () => confirm({ closeDropdown: true }),
                    prefixCls: 'condo-dropdown',
                })
            }
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
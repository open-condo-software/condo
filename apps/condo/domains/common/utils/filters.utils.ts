import { DatePickerProps, FormInstance, InputProps, SelectProps } from 'antd'
import { FormItemProps } from 'antd/es'
import { CheckboxGroupProps } from 'antd/es/checkbox'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import { RangePickerSharedProps } from 'rc-picker/lib/RangePicker'
import React, { CSSProperties } from 'react'

import { FiltersFromQueryType, OptionType, QueryMeta } from './tables.utils'

import { ISearchInputProps } from '../components/GraphQlSearchInput'
import {
    getDateFilterDropdown,
    getDateRangeFilterDropdown,
    getGQLSelectFilterDropdown,
    getOptionFilterDropdown,
    getSelectFilterDropdown,
    getTextFilterDropdown,
} from '../components/Table/Filters'
import { FILTERS_POPUP_CONTAINER_ID } from '../constants/filters'
import { RangePickerProps } from 'antd/lib/date-picker/generatePicker'

export enum FilterComponentSize {
    Small = 8,
    Medium = 12,
    MediumLarge = 16,
    Large = 24,
}

export enum ComponentType {
    Input,
    CheckboxGroup,
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
        formItemProps?: FormItemProps
    },
    columnFilterComponentWrapper?: CSSProperties
}

type GQLSelectFilterType = {
    type: ComponentType.GQLSelect
    props?: ISearchInputProps
}

type InputFilterType = {
    type: ComponentType.Input
    props?: InputProps
}

type CheckboxGroupFilterType = {
    type: ComponentType.CheckboxGroup
    options: OptionType[]
    props?: CheckboxGroupProps
}

type SelectFilterType = {
    type: ComponentType.Select
    options: OptionType[]
    props?: SelectProps<string>
}

type TagsSelectFilterType = {
    type: ComponentType.TagsSelect
    props?: SelectProps<string>
}

type DateFilterType = {
    type: ComponentType.Date
    props?: DatePickerProps
}

type DateRangeFilterType = {
    type: ComponentType.DateRange
    props?: RangePickerProps<Dayjs>
}

type CustomFilterType = {
    type: ComponentType.Custom
    getComponentFilterDropdown?: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: {
        setSelectedKeys: any, selectedKeys: any, confirm: any, clearFilters: any
    }) => JSX.Element
    modalFilterComponent?: React.ReactElement | ((form: FormInstance) => React.ReactElement)
}

export type FilterComponentType = CommonFilterComponentType & (
    GQLSelectFilterType | InputFilterType | CheckboxGroupFilterType | SelectFilterType |
    TagsSelectFilterType | DateFilterType | DateRangeFilterType | CustomFilterType
)

export type FiltersMeta<F> = QueryMeta<F> & {
    component?: FilterComponentType,
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

export function getFilterDropdownByKey <T> (filterMetas: Array<FiltersMeta<T>>, key: string) {
    const filterMeta = filterMetas.find(filterMeta => filterMeta.keyword === key)
    const component = get(filterMeta, 'component')
    const type = get(component, 'type')
    const props = get(component, 'props')
    const columnFilterComponentWrapperStyles = get(component, 'columnFilterComponentWrapper')

    switch (type) {
        case ComponentType.Input: {
            const placeholder = get(props, 'placeholder')

            return getTextFilterDropdown(placeholder, columnFilterComponentWrapperStyles)
        }

        case ComponentType.Date:
            return getDateFilterDropdown(columnFilterComponentWrapperStyles)

        case ComponentType.CheckboxGroup: {
            const options = get(component, 'options')
            const loading = get(component, 'props', 'loading')

            return getOptionFilterDropdown(options, loading, columnFilterComponentWrapperStyles)
        }

        case ComponentType.DateRange:
            return getDateRangeFilterDropdown(props, columnFilterComponentWrapperStyles)

        case ComponentType.Select: {
            const options = get(component, 'options')
            const loading = get(component, 'loading')
            const props = get(component, 'props', {})

            return getSelectFilterDropdown({ options, loading, ...props }, columnFilterComponentWrapperStyles)
        }

        case ComponentType.GQLSelect: {
            const props = get(component, 'props', {})
            const search = get(props, 'search')
            const mode = get(props, 'mode')

            return getGQLSelectFilterDropdown(props, search, mode, columnFilterComponentWrapperStyles)
        }

        case ComponentType.TagsSelect: {
            const props = get(component, 'props', {})

            return getSelectFilterDropdown(
                {
                    mode: 'tags',
                    dropdownStyle: TAGS_SELECT_DROPDOWN_STYLE,
                    allowClear: true,
                    suffixIcon: null,
                    ...props,
                },
                columnFilterComponentWrapperStyles
            )
        }

        case ComponentType.Custom:
            return get(component, 'getComponentFilterDropdown')

        default: return
    }
}

export function convertToOptions <T> (objects: T[], labelField: string, valueField: string): OptionType[] {
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
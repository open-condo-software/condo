import { DatePickerProps, FormInstance, InputProps, SelectProps } from 'antd'
import { FormItemProps } from 'antd/es'
import { CheckboxGroupProps } from 'antd/es/checkbox'
import { RangePickerProps } from 'antd/lib/date-picker/generatePicker'
import { ColumnType } from 'antd/lib/table/interface'
import dayjs, { Dayjs } from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import pickBy from 'lodash/pickBy'
import React, { CSSProperties } from 'react'

import { ISearchInputProps } from '@condo/domains/common/components/GraphQlSearchInput'
import {
    getDateFilterDropdown,
    getDateRangeFilterDropdown,
    getGQLSelectFilterDropdown,
    getOptionFilterDropdown,
    getSelectFilterDropdown,
    getTextFilterDropdown,
} from '@condo/domains/common/components/Table/Filters'
import { FILTERS_POPUP_CONTAINER_ID } from '@condo/domains/common/constants/filters'

import { FiltersFromQueryType, OptionType, QueryMeta } from './tables.utils'

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

type CustomFilterType<RecordType> = {
    type: ComponentType.Custom
    getComponentFilterDropdown?: ColumnType<RecordType>['filterDropdown']
    modalFilterComponent?: React.ReactElement | ((form: FormInstance) => React.ReactElement)
}

export type FilterComponentType<RecordType = unknown> = CommonFilterComponentType & (
    GQLSelectFilterType | InputFilterType | CheckboxGroupFilterType | SelectFilterType |
    TagsSelectFilterType | DateFilterType | DateRangeFilterType | CustomFilterType<RecordType>
)

export type FiltersMeta<FilterType, RecordType = unknown> = QueryMeta<FilterType> & {
    component?: FilterComponentType<RecordType>,
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
import { QueryMeta } from './tables.utils'
import dayjs, { Dayjs } from 'dayjs'
import { FormItemProps } from 'antd/es'
import React, { CSSProperties } from 'react'
import { ISearchInputProps } from '../components/GraphQlSearchInput'
import { DatePickerProps, InputProps, SelectProps } from 'antd'
import { CheckboxGroupProps } from 'antd/es/checkbox'
import { RangePickerSharedProps } from 'rc-picker/lib/RangePicker'
import { get } from 'lodash'
import {
    getDateFilterDropdown,
    getDateRangeFilterDropdown, getGQLSelectFilterDropdown,
    getOptionFilterDropdown, getSelectFilterDropdown,
    getTextFilterDropdown,
} from '../components/Table/Filters'

export enum FilterComponentSize {
    Medium = 12,
    Large = 24,
}

export enum ComponentType {
    Input,
    CheckboxGroup,
    Select,
    GQLSelect,
    ChipsInput,
    Date,
    DateRange,
    Custom,
}

type CommonFilterComponentInfo = {
    modalFilterComponentWrapper?: {
        label?: string
        size?: FilterComponentSize
        formItemProps?: FormItemProps
    },
    columnFilterComponentWrapper?: CSSProperties
}

export type FilterComponentInfo = CommonFilterComponentInfo & ({
    type: ComponentType.GQLSelect
    props: ISearchInputProps
} | {
    type: ComponentType.Input
    props?: InputProps
} | {
    type: ComponentType.CheckboxGroup
    options: { value: string, label: string }[]
    loading: boolean
    props?: CheckboxGroupProps
} | {
    type: ComponentType.Select
    options: { value: string, label: string }[]
    props?: SelectProps<string>
} | {
    type: ComponentType.ChipsInput
    props?: SelectProps<string>
} | {
    type: ComponentType.Date
    props?: DatePickerProps
} | {
    type: ComponentType.DateRange
    props?: RangePickerSharedProps<Dayjs>
} | {
    type: ComponentType.Custom
    getComponentFilterDropdown?: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: {
        setSelectedKeys: any, selectedKeys: any, confirm: any, clearFilters: any
    }) => JSX.Element
    modalFilterComponent?: React.ReactElement
})

export type FiltersMeta<F> = QueryMeta<F> & {
    component?: FilterComponentInfo,
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
            const loading = get(component, 'loading')
            return getOptionFilterDropdown(options, loading, columnFilterComponentWrapperStyles)
        }

        case ComponentType.DateRange:
            return getDateRangeFilterDropdown(columnFilterComponentWrapperStyles)

        case ComponentType.Select: {
            const options = get(component, 'options')
            const loading = get(component, 'loading')
            const mode = get(component, ['props', 'mode'])
            return getSelectFilterDropdown({ options, loading, mode }, columnFilterComponentWrapperStyles)
        }

        case ComponentType.GQLSelect: {
            const search = get(props, 'search')
            const mode = get(props, 'mode')
            return getGQLSelectFilterDropdown(search, mode, columnFilterComponentWrapperStyles)
        }

        case ComponentType.ChipsInput: {
            return getSelectFilterDropdown(
                {
                    mode: 'tags',
                    dropdownStyle: { display: 'none' },
                    allowClear: true,
                },
                columnFilterComponentWrapperStyles
            )
        }

        case ComponentType.Custom: {
            return get(component, 'getComponentFilterDropdown')
        }

        default: return
    }
}
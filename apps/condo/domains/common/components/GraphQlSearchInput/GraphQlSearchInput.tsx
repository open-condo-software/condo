// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Select, SelectProps, Typography } from 'antd'
import get from 'lodash/get'
import throttle from 'lodash/throttle'
import isFunction from 'lodash/isFunction'
import uniqBy from 'lodash/uniqBy'

import { ApolloClient } from '@apollo/client'
import { useApolloClient } from '@condo/next/apollo'
import { useIntl } from '@condo/next/intl'

import {
    useTracking,
    TrackingEventPropertiesType,
    TrackingEventType,
} from '@condo/domains/common/components/TrackingContext'

import { WhereType } from '../../utils/tables.utils'
import { isNeedToLoadNewElements } from '../../utils/select.utils'


type GraphQlSearchInputOption = {
    value: string
    text: string
    data?: any
}

export type RenderOptionFunc = (option: GraphQlSearchInputOption) => JSX.Element

// TODO: add apollo cache shape typings
export interface ISearchInputProps extends SelectProps<string> {
    search: (client: ApolloClient<Record<string, unknown>>, searchText: string, where?: WhereType, first?: number, skip?: number) => Promise<Array<Record<string, unknown>>>
    initialValueSearch?: (client: ApolloClient<Record<string, unknown>>, searchText: string, where?: WhereType, first?: number, skip?: number) => Promise<Array<Record<string, unknown>>>
    onSelect?: (...args: Array<unknown>) => void
    onChange?: (...args: Array<unknown>) => void
    mode?: 'multiple' | 'tags'
    value?: string | string[]
    placeholder?: string
    label?: string
    showArrow?: boolean
    allowClear?: boolean
    disabled?: boolean
    autoFocus?: boolean
    initialValue?: string | string[]
    getInitialValueQuery?: (initialValue: string | string[]) => WhereType
    formatLabel?: (option: GraphQlSearchInputOption) => JSX.Element
    renderOptions?: (items: any[], renderOption: RenderOptionFunc) => JSX.Element[]
    infinityScroll?: boolean
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const DEBOUNCE_TIMEOUT = 800

export const GraphQlSearchInput: React.FC<ISearchInputProps> = (props) => {
    const {
        search,
        initialValueSearch,
        onSelect,
        formatLabel,
        renderOptions,
        autoClearSearchValue,
        initialValue,
        getInitialValueQuery,
        infinityScroll,
        disabled,
        placeholder,
        value: selectedValues,
        eventName: propEventName,
        eventProperties = {},
        ...restProps
    } = props

    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const client = useApolloClient()
    const [selected, setSelected] = useState('')
    const [isLoading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [isAllDataLoaded, setIsAllDataLoaded] = useState(false)
    const [value, setValue] = useState('')

    const _placeholder = useMemo(() => (isLoading && !data.length) ? LoadingMessage : placeholder,
        [LoadingMessage, data.length, isLoading, placeholder])

    const _selectedValue = useMemo(() => (isLoading && !data.length) ? [] : selectedValues,
        [data.length, isLoading, selectedValues])

    const isDisabled = useMemo(() => disabled || (isLoading && !data.length),
        [data.length, disabled, isLoading])

    const { logEvent, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Select)
    const componentProperties = { ...eventProperties }

    const renderOption = (option, index?) => {
        let optionLabel = option.text

        if (formatLabel) {
            optionLabel = formatLabel(option)
        }
        const value = ['string', 'number'].includes(typeof option.value) ? option.value : JSON.stringify(option)

        return (
            <Select.Option id={index} key={option.key || value} value={value} title={option.text}>
                <Typography.Text title={option.text} disabled={disabled}>
                    {optionLabel}
                </Typography.Text>
            </Select.Option>
        )
    }

    const options = renderOptions
        ? renderOptions(data, renderOption)
        : data.map((option, index) => renderOption(option, index))

    const loadInitialOptions = useCallback(async () => {
        const values = initialValue || selectedValues
        const initialValueQuery = isFunction(getInitialValueQuery) ? getInitialValueQuery(values) : { id_in: values }

        if (Array.isArray(values) && values.length) {
            setLoading(true)

            const searchFn = isFunction(initialValueSearch) ? initialValueSearch : search
            const initialOptions = await searchFn(client, null, initialValueQuery, values.length)

            setData(data => uniqBy([...initialOptions, ...data], 'value'))
            setLoading(false)
        }
    }, [initialValue, selectedValues, getInitialValueQuery, initialValueSearch, search, client])

    useEffect(() => {
        loadInitialOptions()
            .catch(err => console.error('failed to load initial options', err))
    }, [loadInitialOptions])

    const handleSearch = useCallback(async searchingValue => {
        if (!search) return
        setValue(searchingValue)

        setLoading(true)
        const data = await search(
            client,
            searchingValue
        )
        setLoading(false)

        if (data.length) setData(data)
    }, [client, search])

    const handleSelect = useCallback(async (value, option) => {
        setSelected(option.children)

        if (props.mode === 'multiple') {
            setValue('')
        }

        if (onSelect) {
            onSelect(value, option)
        }

        if (eventName) {
            const componentValue = get(option, 'title')

            if (componentValue) {
                const componentId = get(restProps, 'id')
                componentProperties['component'] = { value: componentValue }

                if (componentId) {
                    componentProperties['component']['id'] = componentId
                }

                logEvent({ eventName, eventProperties: componentProperties })
            }
        }
        handleSearch('')
    }, [onSelect, props.mode])

    useEffect(() => {
        handleSearch('')
    }, [])

    const handleClear = useCallback(() => {
        setSelected('')
    }, [])

    const searchMoreSuggestions = useCallback(
        async (value, skip) => {
            if (isAllDataLoaded) return

            setLoading(true)
            const data = await search(
                client,
                value,
                null,
                10,
                skip
            )
            setLoading(false)

            if (data.length > 0) {
                setData(prevData => uniqBy([...prevData, ...data], 'value'))
            } else {
                setIsAllDataLoaded(true)
            }
        },
        [client, isAllDataLoaded, search],
    )

    const throttledSearchMore = useMemo(
        () => {
            return throttle(searchMoreSuggestions, DEBOUNCE_TIMEOUT)
        },
        [searchMoreSuggestions],
    )

    const handleScroll = useCallback(async (scrollEvent) => {
        if (isNeedToLoadNewElements(scrollEvent, isLoading)) {
            await throttledSearchMore(value, data.length)
        }
    }, [data, isLoading, throttledSearchMore, value])

    return (
        <Select
            showSearch
            autoClearSearchValue={autoClearSearchValue || false}
            allowClear={true}
            optionFilterProp='title'
            defaultActiveFirstOption={false}
            onSearch={handleSearch}
            onSelect={handleSelect}
            onClear={handleClear}
            onPopupScroll={infinityScroll && handleScroll}
            searchValue={value}
            value={_selectedValue}
            placeholder={_placeholder}
            loading={isLoading}
            disabled={isDisabled}
            {...restProps}
        >
            {options}
        </Select>
    )
}

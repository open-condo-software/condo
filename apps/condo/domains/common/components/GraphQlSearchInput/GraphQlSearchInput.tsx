import { ApolloClient } from '@apollo/client'
import { AutoComplete, Select, SelectProps, Typography } from 'antd'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import throttle from 'lodash/throttle'
import uniqBy from 'lodash/uniqBy'
import React, { useEffect, useState, useCallback, useMemo } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'

import { analytics } from '@condo/domains/common/utils/analytics'

import { isNeedToLoadNewElements } from '../../utils/select.utils'
import { WhereType } from '../../utils/tables.utils'
import { Loader } from '../Loader'


export type GraphQlSearchInputOption = {
    value: string
    text: string | React.ReactNode
    title?: string
    data?: any
}

export type RenderOptionFunc = (option: GraphQlSearchInputOption, index?: number | string) => JSX.Element

export enum SearchComponentType {
    Select,
    AutoComplete,
}

// TODO: add apollo cache shape typings
export interface ISearchInputProps extends SelectProps<string | Array<string>> {
    search: (client: ApolloClient<any>, searchText: string, where?: WhereType, first?: number, skip?: number) => Promise<Array<Record<string, unknown>>>
    initialValueSearch?: (client: ApolloClient<any>, searchText: string, where?: WhereType, first?: number, skip?: number) => Promise<Array<Record<string, unknown>>>
    onSelect?: (...args: Array<unknown>) => void
    onChange?: (...args: Array<unknown>) => void
    onAllDataLoading?: (data: Array<unknown>, allDataLoaded: boolean) => void
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
    keyField?: string
    SearchInputComponentType?: SearchComponentType
    showLoadingMessage?: boolean
    searchMoreFirst?: number
}

const DEBOUNCE_TIMEOUT = 800

export const GraphQlSearchInput: React.FC<ISearchInputProps> = (props) => {
    const {
        search,
        initialValueSearch,
        onSelect,
        onSearch,
        formatLabel,
        renderOptions,
        initialValue,
        getInitialValueQuery,
        infinityScroll,
        disabled,
        placeholder: initialPlaceholder,
        value,
        keyField = 'value',
        onAllDataLoading,
        searchMoreFirst,
        allowClear = true,
        SearchInputComponentType = SearchComponentType.Select,
        showLoadingMessage = true,
        notFoundContent: propsNotFoundContent,
        mode,
        onBlur,
        id,
        ...restProps
    } = props

    const autoClearSearchValue = get(props, 'autoClearSearchValue', mode === 'tags')

    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'LoadingInProgress' })
    const NotFoundMessage = intl.formatMessage({ id: 'NotFound' })

    const client = useApolloClient()
    const [isSearchLoading, setSearchLoading] = useState(false)
    const [isLoadingMore, setLoadingMore] = useState(false)
    const [isInitialLoading, setInitialLoading] = useState(false)
    const [isAllDataLoaded, setIsAllDataLoaded] = useState(false)
    const [initialData, setInitialData] = useState([])
    const [allData, setAllData] = useState([])
    const [options, setOptions] = useState([])
    const [searchData, setSearchData] = useState([])
    const [searchValue, setSearchValue] = useState('')

    useEffect(() => {
        if (isFunction(onAllDataLoading)) {
            const data = uniqBy([...initialData, ...allData], keyField)
            onAllDataLoading(data, isAllDataLoaded)
        }
    }, [allData, onAllDataLoading, isAllDataLoaded])

    const needShowLoadingMessage = showLoadingMessage && (isInitialLoading || ((isSearchLoading || isLoadingMore) && isEmpty(allData)))
    const placeholder = useMemo(() => needShowLoadingMessage ? LoadingMessage : initialPlaceholder,
        [LoadingMessage, initialPlaceholder, needShowLoadingMessage])
    const selectedValue = useMemo(() => needShowLoadingMessage ? [] : value,
        [value, needShowLoadingMessage])
    const isDisabled = disabled || needShowLoadingMessage || !search

    const notFoundContent = useMemo(() => {
        if (isInitialLoading || isSearchLoading || isLoadingMore) {
            return <Loader size='small' delay={0} fill />
        }

        if (propsNotFoundContent) {
            return propsNotFoundContent
        }

        return NotFoundMessage
    },
    [NotFoundMessage, isInitialLoading, isLoadingMore, isSearchLoading, propsNotFoundContent])

    const renderOption: RenderOptionFunc = useCallback((option, index) => {
        let optionLabel: React.ReactNode | string = option.text

        if (formatLabel) {
            optionLabel = formatLabel(option)
        }
        const value = ['string', 'number'].includes(typeof option.value) ? option.value : JSON.stringify(option)
        const key = keyField === 'value' ? value : option[keyField]

        const title = option.title || (typeof option.text === 'string' ? option.text : undefined)

        return (
            <Select.Option id={index} key={key} value={value} title={title} data-cy='search-input--option'>
                <Typography.Text title={title} disabled={disabled}>
                    {optionLabel}
                </Typography.Text>
            </Select.Option>
        )
    }, [disabled, formatLabel, keyField])

    const renderedOptions = useMemo(() => {
        const dataOptions = isFunction(renderOptions)
            ? renderOptions(options, renderOption)
            : options.map((option, index) => renderOption(option, index))
        if (isLoadingMore) {
            dataOptions.push(
                <Select.Option key='loader' disabled>
                    <Loader size='small' delay={0} fill />
                </Select.Option>
            )
        }
        return dataOptions
    }, [renderOptions, options, renderOption, isLoadingMore])

    const loadInitialOptions = useCallback(async () => {
        const values = initialValue || value
        if (!isEmpty(values)) {
            const initialValueQuery = isFunction(getInitialValueQuery) ? getInitialValueQuery(values) : { id_in: values }
            const searchFn = isFunction(initialValueSearch) ? initialValueSearch : search
            if (!searchFn) return
            setInitialLoading(true)
            const initialOptions = await searchFn(client, null, initialValueQuery, values.length)
            setInitialData(prevData => uniqBy([...initialOptions, ...prevData], keyField))
            setInitialLoading(false)
        }
    }, [initialValue, keyField, value, getInitialValueQuery, initialValueSearch, search, client])

    const debounceSearch = useMemo(() => debounce(async (searchingValue) => {
        setIsAllDataLoaded(false)
        const data = await search(client, searchingValue)
        setSearchData(data)
        setSearchLoading(false)
    }, DEBOUNCE_TIMEOUT), [client, search])

    const handleSearch = useCallback(async searchingValue => {
        if (!search) return
        setSearchLoading(true)
        if (isFunction(onSearch)) {
            onSearch(searchingValue)
        }

        setSearchValue(searchingValue)
        await debounceSearch(searchingValue)
    }, [debounceSearch, onSearch, search])

    const handleSelect = useCallback(async (value, option) => {
        if (onSelect) onSelect(value, option)

        const componentValue = get(option, 'title')

        if (componentValue) {
            analytics.track('change', { component: 'GraphQLSearchInput', id, value, location: window.location.href })
        }

        if (autoClearSearchValue || !mode) {
            setSearchValue('')
            setSearchData([])
        }
    }, [onSelect, autoClearSearchValue, mode, id])

    const searchMoreSuggestions = useCallback(
        async (value, skip) => {
            if (!search || isAllDataLoaded) return

            setLoadingMore(true)
            const data = await search(client, value, null, searchMoreFirst || 10, skip)

            if (data.length > 0) {
                const getUniqueData = (prevData) => uniqBy([...prevData, ...data], keyField)
                const dataHandler = searchValue ? setSearchData : setAllData
                dataHandler(getUniqueData)
            } else {
                setIsAllDataLoaded(true)
            }

            setLoadingMore(false)
        },
        [search, isAllDataLoaded, client, searchMoreFirst, searchValue, keyField],
    )

    const handleClear = useCallback(() => {
        setSearchValue('')
    }, [])

    const throttledSearchMore = useMemo(
        () => {
            return throttle(searchMoreSuggestions, DEBOUNCE_TIMEOUT)
        },
        [searchMoreSuggestions],
    )

    const handleScroll = useCallback(async (scrollEvent) => {
        if (isNeedToLoadNewElements(scrollEvent, isSearchLoading)) {
            await throttledSearchMore(searchValue, searchValue ? searchData.length : allData.length)
        }
    }, [isSearchLoading, throttledSearchMore, searchValue, searchData.length, allData.length])

    useEffect(() => {
        loadInitialOptions()
            .catch(err => console.error('failed to load initial options', err))
            .finally(() => searchMoreSuggestions('', 0))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const updatedData = searchValue ? [...searchData] : [...initialData, ...allData]
        setOptions(uniqBy(updatedData, keyField))
    }, [initialData, allData, searchData, searchValue, keyField])

    const handleBlur = useCallback((event) => {
        setSearchValue('')
        if (isFunction(onBlur)) onBlur(event)
    }, [onBlur])

    const commonProps = useMemo(() => ({
        showSearch: true,
        autoClearSearchValue,
        allowClear: allowClear,
        optionFilterProp: 'title',
        defaultActiveFirstOption: false,
        onSearch: handleSearch,
        onSelect: handleSelect,
        onClear: handleClear,
        onPopupScroll: infinityScroll && handleScroll,
        searchValue,
        value: selectedValue,
        placeholder,
        loading: isInitialLoading || isSearchLoading,
        disabled: isDisabled,
        notFoundContent,
        mode,
        onBlur: handleBlur,
        id,
        ...restProps,
    }),
    [allowClear, autoClearSearchValue, handleClear, handleScroll, handleSearch, handleSelect, infinityScroll,
        isDisabled, isInitialLoading, isSearchLoading, notFoundContent, placeholder, restProps, searchValue, selectedValue, mode, handleBlur])

    if (SearchInputComponentType === SearchComponentType.Select) {
        return (
            <Select {...commonProps}>
                {renderedOptions}
            </Select>
        )
    }
    if (SearchInputComponentType === SearchComponentType.AutoComplete) {
        return (
            <AutoComplete
                dataSource={renderedOptions}
                {...commonProps}
            />
        )
    }
}

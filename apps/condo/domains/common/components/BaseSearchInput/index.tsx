import { OptionProps } from 'antd/lib/mentions'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, SelectProps } from 'antd'
import debounce from 'lodash/debounce'
import throttle from 'lodash/throttle'
import { useIntl } from '@core/next/intl'
import { InitialValuesGetter, useInitialValueGetter } from './useInitialValueGetter'
import { useSelectCareeteControls } from './useSelectCareeteControls'
import { Loader } from '../Loader'

const { Option } = Select

const DEBOUNCE_TIMEOUT = 800

interface ISearchInput<S> extends Omit<SelectProps<S>, 'onSelect'> {
    loadOptionsOnFocus?: boolean
    renderOption: (dataItem, value, index?) => React.ReactElement
    // TODO(Dimtireee): remove any
    search: (queryString, skip?) => Promise<Array<Record<string, any>>>
    initialValueGetter?: InitialValuesGetter
    onSelect?: (value: string, option: OptionProps) => void

    infinityScroll?: boolean
}

export const BaseSearchInput = <S extends string>(props: ISearchInput<S>) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const NotFoundMessage = intl.formatMessage({ id: 'NotFound' })

    const {
        search,
        autoFocus,
        onBlur,
        onSelect,
        onChange,
        placeholder,
        renderOption,
        initialValueGetter,
        loadOptionsOnFocus = true,
        notFoundContent = NotFoundMessage,
        style,
        infinityScroll,
        value,
        ...restSelectProps
    } = props

    const [selected, setSelected] = useState('')
    const [fetching, setFetching] = useState(false)
    const [data, setData] = useState([])
    const [searchValue, setSearchValue] = useState('')
    const [initialOptionsLoaded, setInitialOptionsLoaded] = useState(false)
    const [initialValue, isInitialValueFetching] = useInitialValueGetter(value, initialValueGetter)
    const [scrollInputCaretToEnd, setSelectRef, selectInputNode] = useSelectCareeteControls(restSelectProps.id)

    const searchSuggestions = useCallback(
        async (value) => {
            setFetching(true)
            const data = await search((selected) ? selected + ' ' + value : value)
            setFetching(false)
            setData(data)
        },
        [],
    )

    const debouncedSearch = useMemo(
        () => {
            return debounce(searchSuggestions, DEBOUNCE_TIMEOUT)
        },
        [searchSuggestions],
    )

    const searchMoreSuggestions = useCallback(
        async (value, skip) => {
            setFetching(true)
            const data = await search((selected) ? selected + ' ' + value : value, skip)
            console.log('data', skip, data)
            setFetching(false)
            setData(prevData => [...prevData, ...data])
        },
        [],
    )

    const debouncedSearchMore = useMemo(
        () => {
            return throttle(searchMoreSuggestions, DEBOUNCE_TIMEOUT)
        },
        [searchMoreSuggestions],
    )

    const loadInitialOptions = useCallback(
        (e) => {
            if (props.onFocus) {
                props.onFocus(e)
            }

            if (loadOptionsOnFocus && !initialOptionsLoaded) {
                debouncedSearch(searchValue)
                setInitialOptionsLoaded(true)
            }
        },
        [initialOptionsLoaded],
    )

    const handleSelect = useCallback(
        (value, option) => {
            if (onSelect) {
                props.onSelect(value, option)
            }

            setSelected(option.children)
        },
        [],
    )

    const handleClear = useCallback(
        () => {
            setSelected(null)
            if (props.onClear)
                props.onClear()
        },
        [],
    )

    const handleChange = (value, options) => {
        setSearchValue(value)
        onChange(value, options)
    }

    const handleScroll = async (e) => {
        const dropdown = e.currentTarget
        const containerTop = dropdown.getBoundingClientRect().top
        const containerHeight = dropdown.getBoundingClientRect().height
        const lastElement = document.getElementById(String((data || []).length - 1))
        const lastElementTopPos = lastElement && lastElement.getBoundingClientRect().top - containerTop

        if (lastElementTopPos && lastElementTopPos < containerHeight && !fetching) {
            await debouncedSearchMore(value, data.length)
        }
    }

    useEffect(
        () => {
            setSearchValue(value)
        },
        [value]
    )

    useEffect(
        () => {
            setSearchValue(initialValue)
        },
        [initialValue],
    )

    useEffect(
        () => {
            scrollInputCaretToEnd(selectInputNode)
        },
        [selectInputNode, selected],
    )

    const options = useMemo(
        () => {
            const dataOptions = data.map((option, index) => renderOption(option, value, index))

            return fetching ? [...dataOptions, <Option value={null} key={'loader'} disabled>
                <Loader style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}/>
            </Option>] : dataOptions
        },
        [data, fetching, value],
    )

    return (
        <Select
            showSearch
            autoFocus={autoFocus}
            allowClear
            id={props.id}
            value={isInitialValueFetching ? LoadingMessage : searchValue}
            disabled={Boolean(isInitialValueFetching)}
            onFocus={loadInitialOptions}
            onSearch={debouncedSearch}
            onSelect={handleSelect}
            onBlur={onBlur}
            onChange={handleChange}
            onClear={handleClear}
            onPopupScroll={infinityScroll && handleScroll}
            ref={setSelectRef}
            placeholder={placeholder}
            notFoundContent={fetching ? <Loader size="small" delay={0} fill/> : notFoundContent}
            // TODO(Dimitreee): remove ts ignore after combobox mode will be introduced after ant update
            // @ts-ignore
            mode={'SECRET_COMBOBOX_MODE_DO_NOT_USE'}
            showArrow={false}
            filterOption={false}
            autoClearSearchValue={false}
            defaultActiveFirstOption={false}
            style={style}
        >
            {options}
        </Select>
    )
}
import { OptionProps } from 'antd/lib/mentions'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, SelectProps } from 'antd'
import debounce from 'lodash/debounce'
import { useIntl } from '@core/next/intl'
import { InitialValuesGetter, useInitialValueGetter } from './useInitialValueGetter'
import { useSelectCareeteControls } from './useSelectCareeteControls'
import { Loader } from '../Loader'

const DEBOUNCE_TIMEOUT = 800

interface ISearchInput<S> extends Omit<SelectProps<S>, 'onSelect'> {
    loadOptionsOnFocus?: boolean
    renderOption: (dataItem, value) => React.ReactElement
    // TODO(Dimtireee): remove any
    search: (queryString) => Promise<Array<Record<string, any>>>
    initialValueGetter?: InitialValuesGetter
    onSelect?: (value: string, option: OptionProps) => void
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
        ...restSelectProps
    } = props

    const [selected, setSelected] = useState('')
    const [fetching, setFetching] = useState(false)
    const [data, setData] = useState([])
    const [searchValue, setSearchValue] = useState('')
    const [initialOptionsLoaded, setInitialOptionsLoaded] = useState(false)
    const [initialValue, isInitialValueFetching] = useInitialValueGetter(restSelectProps.value, initialValueGetter)
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
        },
        [],
    )

    useEffect(
        () => {
            // This input is usually controlled by form that is directly setting value, so we don't need to 
            // bind in two way, as it causes input to force place careete to the end of text.
            if (!onChange){
                setSearchValue(restSelectProps.value)
            }
        },
        [restSelectProps.value]
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
        () => data.map((option) => renderOption(option, restSelectProps.value)),
        [data, fetching, restSelectProps.value],
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
            onChange={onChange}
            onClear={handleClear}
            ref={setSelectRef}
            placeholder={placeholder}
            notFoundContent={fetching ? <Loader size="small" delay={0} fill /> : notFoundContent}
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

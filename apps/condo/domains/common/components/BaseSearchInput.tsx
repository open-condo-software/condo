/** @jsx jsx */
import { jsx } from '@emotion/core'
import { css } from '@emotion/core'
import { OptionProps } from 'antd/lib/mentions'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Select, Spin, SelectProps } from 'antd'
import debounce from 'lodash/debounce'
import { useIntl } from '@core/next/intl'
import { InitialValuesGetter, useInitialValueGetter } from '../hooks/useInitialValueGetter'
import { useSelectCareeteControls } from '../hooks/useSelectCareeteControls'

const DEBOUNCE_TIMEOUT = 800

export const preDashedSelectOptionsStyles = css`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl;
  text-align: left;
`

interface ISearchInput<S> extends Omit<SelectProps<S>, 'onSelect'> {
    renderOption: (dataItem) => React.ReactElement
    // TODO(Dimtireee): remove any
    search: (queryString) => Promise<Array<Record<string, any>>>
    initialValueGetter?: InitialValuesGetter
    onSelect?: (value: string, option: OptionProps) => void
}

export const BaseSearchInput = <S extends string>(props: ISearchInput<S>) => {
    const intl = useIntl()
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const {
        search,
        onSelect,
        renderOption,
        initialValueGetter,
        ...restSelectProps
    } = props

    const [selected, setSelected] = useState('')
    const [fetching, setFetching] = useState(false)
    const [data, setData] = useState([])
    const [searchValue, setSearchValue] = useState(LoadingMessage)
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

            if (!initialOptionsLoaded) {
                setInitialOptionsLoaded(true)
                debouncedSearch(searchValue)
            }
        },
        [],
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
            setSelected('')
        },
        [],
    )

    useEffect(
        () => {
            setSearchValue(restSelectProps.value)
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
            scrollInputCaretToEnd()
        },
        [selectInputNode, selected],
    )

    const options = useMemo(
        () => data.map(renderOption),
        [data, fetching],
    )

    return (
        <Select
            {...restSelectProps}
            showSearch
            autoFocus
            allowClear
            value={searchValue}
            disabled={Boolean(isInitialValueFetching)}
            onFocus={loadInitialOptions}
            onSearch={debouncedSearch}
            onSelect={handleSelect}
            onClear={handleClear}
            ref={setSelectRef}
            notFoundContent={fetching ? <Spin size="small" /> : null}
            // TODO(Dimitreee): remove ts ignore after combobox mode will be introduced after ant update
            // @ts-ignore
            mode={'SECRET_COMBOBOX_MODE_DO_NOT_USE'}
            showArrow={false}
            filterOption={false}
            autoClearSearchValue={false}
            defaultActiveFirstOption={false}
        >
            {options}
        </Select>
    )
}

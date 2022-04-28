// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Select, SelectProps, Typography } from 'antd'
import isFunction from 'lodash/isFunction'
import uniqBy from 'lodash/uniqBy'
import { ApolloClient } from '@apollo/client'
import { useApolloClient } from '@core/next/apollo'

import { WhereType } from '../utils/tables.utils'
import throttle from 'lodash/throttle'
import { isNeedToLoadNewElements } from '../utils/select.utils'
import { SelectStyled } from './SelectStyled'


type GraphQlSearchInputOption = {
    value: string
    text: string
    data?: any
}

export type RenderOptionFunc = (option: GraphQlSearchInputOption) => JSX.Element

// TODO: add apollo cache shape typings
export interface ISearchInputProps extends SelectProps<string> {
    search: (client: ApolloClient<Record<string, unknown>>, searchText: string, where?: WhereType, first?: number, skip?: number) => Promise<Array<Record<string, unknown>>>
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
}

const DEBOUNCE_TIMEOUT = 800

export const GraphQlSearchInput: React.FC<ISearchInputProps> = (props) => {
    const {
        search,
        onSelect,
        formatLabel,
        renderOptions,
        autoClearSearchValue,
        initialValue,
        getInitialValueQuery,
        infinityScroll,
        ...restProps
    } = props
    const client = useApolloClient()
    const [selected, setSelected] = useState('')
    const [isLoading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [isAllDataLoaded, setIsAllDataLoaded] = useState(false)
    const [value, setValue] = useState('')

    const renderOption = (option, index?) => {
        let optionLabel = option.text

        if (formatLabel) {
            optionLabel = formatLabel(option)
        }
        const value = ['string', 'number'].includes(typeof option.value) ? option.value : JSON.stringify(option)

        return (
            <Select.Option id={index} key={option.key || value} value={value} title={option.text}>
                <Typography.Text title={option.text}>{optionLabel}</Typography.Text>
            </Select.Option>
        )
    }

    const options = renderOptions
        ? renderOptions(data, renderOption)
        : data.map((option, index) => renderOption(option, index))

    const loadInitialOptions = useCallback(async () => {
        const initialValueQuery = isFunction(getInitialValueQuery) ? getInitialValueQuery(initialValue) : { id_in: initialValue }

        if (Array.isArray(initialValue) && initialValue.length) {
            setLoading(true)
            const initialOptions = await search(client, null, initialValueQuery, initialValue.length)

            setData(data => uniqBy([...initialOptions, ...data], 'value'))
            setLoading(false)
        }
    }, [initialValue, getInitialValueQuery, client, search])

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
                setData(prevData => [...prevData, ...data])
            } else {
                setIsAllDataLoaded(true)
            }
        },
        [],
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
        <SelectStyled
            showSearch
            autoClearSearchValue={autoClearSearchValue || false}
            allowClear={true}
            optionFilterProp={'title'}
            defaultActiveFirstOption={false}
            onSearch={handleSearch}
            onSelect={handleSelect}
            onClear={handleClear}
            onPopupScroll={infinityScroll && handleScroll}
            searchValue={value}
            value={value}
            loading={isLoading}
            {...restProps}
        >
            {options}
        </SelectStyled>
    )
}
import styled from '@emotion/styled'
import { isEmpty } from 'lodash'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import throttle from 'lodash/throttle'
import uniqBy from 'lodash/uniqBy'
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import { Close } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { colors } from '@open-condo/ui/colors'

import Select, { CustomSelectProps } from '@condo/domains/common/components/antd/Select'
import { Loader } from '@condo/domains/common/components/Loader'
import { isNeedToLoadNewElements } from '@condo/domains/common/utils/select.utils'

import { InitialValuesGetter, useInitialValueGetter } from './useInitialValueGetter'
import { useSelectCareeteControls } from './useSelectCareeteControls'


const { Option } = Select

const DEBOUNCE_TIMEOUT = 800

interface ISearchInput<S> extends Omit<CustomSelectProps<S>, 'onSelect'> {
    loadOptionsOnFocus?: boolean
    renderOption: (dataItem, value, index?) => React.ReactElement
    // TODO(Dimtireee): remove any
    search: (searchText, skip?) => Promise<Array<Record<string, any>>>
    initialValueGetter?: InitialValuesGetter
    onSelect?: (value: string, option) => void
    infinityScroll?: boolean
    setIsMatchSelectedProperty?: Dispatch<SetStateAction<boolean>>
}

const StyledSelect = styled(Select)`
  .ant-select-selection-placeholder {
    color: ${colors.gray[7]};
    opacity: 0.6;
  }
  
  .ant-select-clear {
    right: 16px;
    color: ${colors.black};
  }
`

const SELECT_LOADER_STYLE = { display: 'flex', justifyContent: 'center', padding: '10px 0' }

export const BaseSearchInput = <S extends string> (props: ISearchInput<S>) => {
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
        notFoundContent: propsNotFoundContent = NotFoundMessage,
        setIsMatchSelectedProperty,
        style,
        infinityScroll,
        value,
        loading,
        ...restSelectProps
    } = props

    const [selected, setSelected] = useState('')
    const [fetching, setFetching] = useState(false)
    const [data, setData] = useState([])
    const [isAllDataLoaded, setIsAllDataLoaded] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [initialOptionsLoaded, setInitialOptionsLoaded] = useState(false)
    const [initialValue, isInitialValueFetching] = useInitialValueGetter(value, initialValueGetter)
    const [scrollInputCaretToEnd, setSelectRef, selectInputNode] = useSelectCareeteControls(restSelectProps.id)
    const [isEmptyDataFetched, setIsEmptyDataFetched] = useState<boolean>(false)

    const searchSuggestions = useCallback(
        async (value) => {
            setIsAllDataLoaded(false)
            setFetching(true)
            const data = await search(value)
            setIsEmptyDataFetched(value && get(data, 'length', 0) === 0)
            setFetching(false)
            setData(data)
        },
        [search],
    )

    const debouncedSearch = useMemo(
        () => {
            return debounce(searchSuggestions, DEBOUNCE_TIMEOUT)
        },
        [searchSuggestions],
    )

    const searchMoreSuggestions = useCallback(
        async (value, skip) => {
            if (isAllDataLoaded) return

            setFetching(true)
            const data = await search(searchValue, skip)
            setFetching(false)

            if (data.length > 0) {
                setData(prevData => uniqBy([...prevData, ...data], 'text'))
            } else {
                setIsAllDataLoaded(true)
            }
        },
        [isAllDataLoaded, search, searchValue],
    )

    const throttledSearchMore = useMemo(
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
        [loadOptionsOnFocus, searchValue, props, debouncedSearch, initialOptionsLoaded],
    )

    const handleSelect = useCallback(
        (value, option) => {
            if (onSelect) {
                props.onSelect(value, option)
            }

            setSelected(value)
        },
        [],
    )

    const handleClear = useCallback(
        () => {
            setSelected(null)
            if (isFunction(setIsMatchSelectedProperty)) {
                setIsMatchSelectedProperty(true)
            }
            if (isFunction(props.onClear))
                props.onClear()
        },
        [],
    )

    const handleChange = useCallback((value, options) => {
        setSearchValue(value)
        onChange(value, options)
    }, [onChange])

    // Checking for compliance of the selected property and the value in the search bar
    useEffect(() => {
        if (!isEmpty(selected) && isFunction(setIsMatchSelectedProperty)) {
            if (selected !== searchValue) setIsMatchSelectedProperty(false)
            else setIsMatchSelectedProperty(true)
        }
    }, [searchValue, props, selected])

    const handleScroll = useCallback(async (scrollEvent) => {
        if (isNeedToLoadNewElements(scrollEvent, fetching)) {
            await throttledSearchMore(value, data.length)
        }
    }, [data, fetching, throttledSearchMore, value])

    useEffect(
        () => {
            setSelected(initialValue)
            setSearchValue(initialValue)
        },
        [initialValue],
    )

    useEffect(
        () => {
            scrollInputCaretToEnd(selectInputNode)
        },
        [scrollInputCaretToEnd, selectInputNode, selected],
    )

    const options = useMemo(
        () => {
            const dataOptions = data.map((option, index) => renderOption(option, value, index))

            if (!fetching && !loading) return dataOptions

            return [
                ...dataOptions,
                (
                    <Option key='loader' value={null} disabled>
                        <Loader style={SELECT_LOADER_STYLE}/>
                    </Option>
                ),
            ]
        },
        [data, fetching, loading, renderOption, value],
    )

    const notFoundContent = useMemo(() => {
        if (fetching || loading) return <Loader size='small' delay={0} fill/>

        if (isEmptyDataFetched) {
            return propsNotFoundContent
        }
    }, [fetching, isEmptyDataFetched, loading, propsNotFoundContent])

    return (
        <StyledSelect
            showSearch
            autoFocus={autoFocus}
            allowClear
            clearIcon={<Close size='small' />}
            id={props.id}
            value={isInitialValueFetching ? LoadingMessage : searchValue}
            disabled={props.disabled || Boolean(isInitialValueFetching)}
            onFocus={loadInitialOptions}
            onSearch={debouncedSearch}
            onSelect={handleSelect}
            onBlur={onBlur}
            onChange={handleChange}
            onClear={handleClear}
            onPopupScroll={infinityScroll && handleScroll}
            ref={setSelectRef}
            placeholder={placeholder}
            notFoundContent={notFoundContent}
            // TODO(Dimitreee): remove ts ignore after combobox mode will be introduced after ant update
            // @ts-ignore
            mode='SECRET_COMBOBOX_MODE_DO_NOT_USE'
            showArrow={false}
            filterOption={false}
            autoClearSearchValue={false}
            defaultActiveFirstOption={false}
            style={style}
            loading={loading}
        >
            {options}
        </StyledSelect>
    )
}

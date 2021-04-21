import getConfig from 'next/config'
import React, { useCallback, useMemo, useState } from 'react'
import { Select, Spin } from 'antd'
import debounce from 'lodash/debounce'
import pickBy from 'lodash/pickBy'
import identity from 'lodash/identity'

const DEBOUNCE_TIMEOUT = 800

function getAddressSuggestionsConfig () {
    const {
        publicRuntimeConfig: { addressSuggestionsConfig },
    } = getConfig()
    const { apiUrl, apiToken } = addressSuggestionsConfig
    if (!apiToken || !apiUrl) console.error('Wrong AddressSuggestionsConfig! no apiUrl/apiToken')
    return { apiUrl, apiToken }
}

async function searchAddress (query) {
    const { apiUrl, apiToken } = getAddressSuggestionsConfig()

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Token ${apiToken}`,
        },
        body: JSON.stringify({ query }),
    })

    const { suggestions } = await response.json()
    // FORMAT: { suggestions: [ { value: "Address1", meta1: value1, meta2: value2, ... }, ... ] }

    return suggestions.map(suggestion => {
        const cleanedSuggestion = pickBy(suggestion, identity)

        return {
            text: suggestion.value,
            value: JSON.stringify({ ...cleanedSuggestion, address: suggestion.value }),
        }
    })
}

export const AddressSearchInput: React.FC = (props) => {
    const [value, setValue] = useState()
    const [searchValue, setSearchValue] = useState('')
    const [fetching, setFetching] = useState(false)
    const [data, setData] = useState([])
    const options = useMemo(() => {
        return data.map(d => <Select.Option key={d.value} value={d.value} title={d.text}>{d.text}</Select.Option>)
    }, [data])

    const searchSuggestions = useCallback(async (term) => {
        setFetching(true)
        const data = await searchAddress(term)

        setFetching(false)
        setData(data)
    }, [searchAddress])

    const debouncedSearchSuggestions = useMemo(() => {
        return debounce(searchSuggestions, DEBOUNCE_TIMEOUT)
    }, [searchSuggestions])

    const handleOnSearch = (term) => {
        setSearchValue(term)
        debouncedSearchSuggestions(term)
    }

    const handleSelect = useCallback((val, option) => {
        setValue(option.children)
    }, [])

    const handleClear = useCallback(() => {
        clearSelection()
    }, [])

    const handleKeyDown = (e: KeyboardEvent) => {
        // `Select` component from Ant displays either `searchText` or selected `Option`,
        // which are two DOM elements on the same position. It's not supposed by Ant to display both of them.
        // Once `Option` is selected, `searchText` (typed by hands) will be wiped out.
        // Out of the box, it's impossible to continue editing what user has selected,
        // because `Option` is not editable, it's selectable.
        // To make it possible from visual point of view, we need to:
        // 1. Set `searchText` to text of selected `Option` to let user to reuse selected Option's text and edit it
        // 2. Clear `value`, that causes selected Option to disappear
        if (e.key === 'Backspace' && value) {
            setSearchValue(value)
            clearSelection()
        }
    }

    const clearSelection = () => {
        setValue(null)
    }

    return (
        <Select
            showSearch
            value={value}
            searchValue={searchValue}
            autoClearSearchValue={false}
            allowClear={true}
            defaultActiveFirstOption={false}
            onSearch={handleOnSearch}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            onClear={handleClear}
            loading={fetching}
            notFoundContent={fetching ? <Spin size="small" /> : null}
            showArrow={false}
            filterOption={false}
            {...props}
        >
            {options}
        </Select>
    )
}

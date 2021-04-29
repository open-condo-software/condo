import React, { useCallback, useMemo, useState } from 'react'
import { Select, Spin } from 'antd'
import debounce from 'lodash/debounce'
import pickBy from 'lodash/pickBy'
import identity from 'lodash/identity'
import { DadataApi, IDadataApi } from '../utils/dadataApi'

const DEBOUNCE_TIMEOUT = 800

async function searchAddress (api: IDadataApi, query) {
    const { suggestions } = await api.getSuggestions(query)

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
    const [selected, setSelected] = useState('')
    const [fetching, setFetching] = useState(false)
    const [data, setData] = useState([])
    const api = useMemo(() => {
        return new DadataApi()
    }, [])
    const options = useMemo(() => {
        return data.map(d => <Select.Option key={d.value} value={d.value} title={d.text}>{d.text}</Select.Option>)
    }, [data])

    const searchSuggestions = useCallback(async (value) => {
        setFetching(true)
        const data = await searchAddress(api, (selected) ? selected + ' ' + value : value)

        setFetching(false)
        setData(data)
    }, [searchAddress])

    const debouncedSearch = useMemo(() => {
        return debounce(searchSuggestions, DEBOUNCE_TIMEOUT)
    }, [searchSuggestions])

    const handleSelect = useCallback((value, option) => {
        setSelected(option.children)
    }, [])

    const handleClear = useCallback(() => {
        setSelected('')
    }, [])

    return (
        <Select
            showSearch
            autoClearSearchValue={false}
            allowClear={true}
            defaultActiveFirstOption={false}
            onSearch={debouncedSearch}
            onSelect={handleSelect}
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

import { useApolloClient } from '@core/next/apollo'
import { useEffect, useMemo, useState } from 'react'
import { Select } from 'antd'

function SearchInput ({ search, ...props }) {
    const client = useApolloClient()
    const [selected, setSelected] = useState('')
    const [data, setData] = useState([])
    const [value, setValue] = useState('')
    const options = useMemo(
        () => data.map(d => <Select.Option key={d.value} value={d.value}>{d.text}</Select.Option>),
        [data, value],
    )

    async function handleSearch (value) {
        const data = await search(client, (selected) ? selected + ' ' + value : value)
        if (data.length) setData(data)
        setValue(value)
    }

    function handleSelect (value, options) {
        setSelected(options.children)
    }

    function handleClear () {
        setSelected('')
    }

    useEffect(() => {
        handleSearch('')
    }, [])

    return <Select
        showSearch
        autoClearSearchValue={false}
        allowClear={true}
        defaultActiveFirstOption={false}
        defaultValue={value}
        onSearch={handleSearch}
        onSelect={handleSelect}
        onClear={handleClear}
        searchValue={value}
        {...props}
    >
        {options}
    </Select>
}

export {
    SearchInput,
}

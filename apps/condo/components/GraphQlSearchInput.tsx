// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useApolloClient } from '@core/next/apollo'
import React, { useEffect, useMemo, useState } from 'react'
import { Select, SelectProps } from 'antd'
import { ApolloClient } from '@apollo/client'

// TODO: add apollo cache shape typings
interface ISearchInputProps extends SelectProps {
    search: (client: ApolloClient<Record<string, unknown>>, queryArguments: string) => Promise<Array<Record<string, unknown>>>
    onSelect?: (...args: Array<unknown>) => void
    placeholder?: string
    label?: string
    showArrow?: boolean
    allowClear?: boolean
    disabled?: boolean
    autoFocus?: boolean
    initialValue?: string
}

export const GraphQlSearchInput:React.FunctionComponent<ISearchInputProps> = (props) => {
    const { search, onSelect, ...restProps } = props
    const client = useApolloClient()
    const [selected, setSelected] = useState('')
    const [isLoading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [value, setValue] = useState('')
    const options = useMemo(
        () => data.map(d => <Select.Option key={d.value} value={d.value} title={d.text}>{d.text}</Select.Option>),
        [data, value],
    )

    useEffect(() => {
        handleSearch('')
    }, [])

    async function handleSearch (value) {
        setLoading(true)
        const data = await search(client, (selected) ? selected + ' ' + value : value)
        setLoading(false)
        if (data.length) setData(data)
        setValue(value)
    }

    function handleSelect (value, option) {
        setSelected(option.children)

        if (onSelect) {
            onSelect(value, option)
        }
    }

    function handleClear () {
        setSelected('')
    }

    return (
        <Select
            showSearch
            autoClearSearchValue={false}
            allowClear={true}
            optionFilterProp={'title'}
            defaultActiveFirstOption={false}
            onSearch={handleSearch}
            onSelect={handleSelect}
            onClear={handleClear}
            searchValue={value}
            loading={isLoading}
            {...restProps}
        >
            {options}
        </Select>
    )
}

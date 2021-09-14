// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useApolloClient } from '@core/next/apollo'
import React, { useEffect, useState } from 'react'
import { Select, SelectProps } from 'antd'
import { ApolloClient } from '@apollo/client'

// TODO: add apollo cache shape typings
interface ISearchInputProps extends SelectProps<string> {
    search: (client: ApolloClient<Record<string, unknown>>, queryArguments: string) => Promise<Array<Record<string, unknown>>>
    onSelect?: (...args: Array<unknown>) => void
    onChange?: (...args: Array<unknown>) => void
    mode?: 'multiple' | 'tag'
    value?: string | string[]
    placeholder?: string
    label?: string
    showArrow?: boolean
    allowClear?: boolean
    disabled?: boolean
    autoFocus?: boolean
    initialValue?: string
    formatLabel?: (option: { value: string, text: string, data?: any }) => JSX.Element
}

export const GraphQlSearchInput: React.FC<ISearchInputProps> = (props) => {
    const { search, onSelect, formatLabel, autoClearSearchValue, ...restProps } = props
    const client = useApolloClient()
    const [selected, setSelected] = useState('')
    const [isLoading, setLoading] = useState(false)
    const [data, setData] = useState([])
    const [value, setValue] = useState('')
    const options = data.map((option) => {
        let optionLabel = option.text

        if (formatLabel) {
            optionLabel = formatLabel(option)
        }
        const value = ['string', 'number'].includes(typeof option.value) ? option.value : JSON.stringify(option)

        return (
            <Select.Option key={option.key || value } value={value} title={option.text}>
                {optionLabel}
            </Select.Option>
        )
    })

    useEffect(() => {
        handleSearch('')
    }, [])

    async function handleSearch (value) {
        if (!search) return
        setLoading(true)

        const data = await search(
            client,
            (selected && (!props.mode || props.mode !== 'multiple'))
                ? selected + ' ' + value
                : value,
        )
        setLoading(false)
        if (data.length) setData(data)
        setValue(value)
    }

    function handleSelect (value, option) {
        setSelected(option.children)

        if (props.mode === 'multiple') {
            setValue('')
        }

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
            autoClearSearchValue={autoClearSearchValue || false}
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

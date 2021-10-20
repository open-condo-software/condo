import React, { useEffect, useState } from 'react'
import { Select } from 'antd'

const { Option } = Select

export function ChipsInput () {
    // const alphanumeric = /^[\p{L}\p{N}]*$/u;
    const [options, setOptions] = useState([])
    const [currentOption, setCurrentOption] = useState('')

    useEffect(() => {
        setCurrentOption(' ')
    }, [options.length])

    function onKeyDown (key) {
        const value = key.key
        if (value === 'Enter') {
            const trimmedCurrentOption = currentOption.trim()
            if (trimmedCurrentOption === '') {
                return
            }

            if (options.find((option) => option.label === trimmedCurrentOption)) {
                return setCurrentOption(' ')
            }

            setOptions((opts) => [
                ...opts,
                { label: trimmedCurrentOption, value: trimmedCurrentOption },
            ])
        }
    }

    function handleBlur () {
        const trimmedCurrentOption = currentOption.trim()
        if (trimmedCurrentOption === '') {
            return
        }

        if (options.find((option) => option.label === trimmedCurrentOption)) {
            return setCurrentOption(' ')
        }

        setOptions((opts) => [
            ...opts,
            { label: trimmedCurrentOption, value: trimmedCurrentOption },
        ])
    }

    function onDeselect (value) {
        setOptions((options) => options.filter((option) => option.value !== value))
    }

    const onClear = () => {
        setOptions([])
    }

    const onChange = (value, option) => {
        console.log('value, option', value, option)
    }

    function handleSearch (value) {
        setCurrentOption(value)
    }

    // не юзаю антовский tokenSeparators потому что для него
    // у нас уже должны быть сгенерены опции
    return (
        <Select
            mode="multiple"
            allowClear
            style={{ width: '100%' }}
            // options={options}
            value={options.map((opt) => opt.value)}
            inputValue={currentOption}
            // dropdownStyle={{ display: 'none' }}
            onBlur={handleBlur}
            onSelect={(e) => console.log(e)}
            onDeselect={onDeselect}
            onClear={onClear}
            onKeyDown={onKeyDown}
            onChange={onChange}
            onSearch={handleSearch}
        >
            {
                options.map(option => (
                    <Option key={option.value} value={option.value}>
                        {option.label}
                    </Option>
                ))
            }
        </Select>
    )
}

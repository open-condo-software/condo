import { Input, InputProps } from 'antd'
import React from 'react'
import { NUMBERS_AND_PLUS } from '../constants/regexps'

export const NumericInput:React.FC<InputProps> = (props) => {
    const onChange = React.useCallback((e:React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target

        if ((!isNaN(Number(value)) && NUMBERS_AND_PLUS.test(value)) || value === '' || value === '+') {
            props.onChange(e)
        }
    }, [])

    return (
        <Input {...props} onChange={onChange}/>
    )
}

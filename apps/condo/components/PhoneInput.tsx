import { Input, InputProps } from 'antd'
import React from 'react'
import { PHONE } from '../constants/regexps'

export const PhoneInput: React.FC<InputProps> = (props) => {
    const onChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target

        if ((!isNaN(Number(value)) && PHONE.test(value)) || value === '' || value === '+') {
            props.onChange(e)
        }
    }, [])

    return (
        <Input {...props} onChange={onChange}/>
    )
}

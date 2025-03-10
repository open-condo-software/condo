import { Input as BaseInput, InputProps } from 'antd'
import React from 'react'

/** @deprecated use Input from "@open-condo/ui" */
const Input = (props: InputProps) => {
    return <BaseInput {...props} />
}

Input.Password = BaseInput.Password
Input.TextArea = BaseInput.TextArea
Input.Search = BaseInput.Search
Input.Group = BaseInput.Group

export default Input

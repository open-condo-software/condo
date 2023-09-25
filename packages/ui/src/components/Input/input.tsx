import {
    Input as DefaultInput,
    InputProps as DefaultInputProps,
} from 'antd'
import React, { InputHTMLAttributes } from 'react'

import type { InputRef } from 'antd/lib/input'

export const INPUT_CLASS_PREFIX = 'condo-input'

export type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'size'>
& Pick<DefaultInputProps, 'disabled'>

const Input: React.ForwardRefExoticComponent<BaseInputProps & React.RefAttributes<InputRef>> = React.forwardRef((props, ref) => {
    return <DefaultInput {...props} ref={ref} prefixCls={INPUT_CLASS_PREFIX}/>
})

Input.displayName = 'Input'

export {
    Input,
}
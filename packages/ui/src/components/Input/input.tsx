import {
    Input as DefaultInput,
    InputProps as DefaultInputProps,
} from 'antd'
import React, { InputHTMLAttributes, useMemo } from 'react'

import { Close } from '@open-condo/icons'

import type { InputRef } from 'antd/lib/input'

export const INPUT_CLASS_PREFIX = 'condo-input'

export type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'size'>
& Pick<DefaultInputProps, 'disabled'>

export type InputProps = BaseInputProps & {
    allowClear?: boolean
}

const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<InputRef>> = React.forwardRef((props, ref) => {
    const { allowClear: allowClearProp, ...restProps } = props

    const allowClear = useMemo(() => {
        if (allowClearProp) {
            return { clearIcon: <Close size='small'/> }
        }

        return false
    }, [allowClearProp])

    return <DefaultInput {...restProps} ref={ref} prefixCls={INPUT_CLASS_PREFIX} allowClear={allowClear}/>
})

Input.displayName = 'Input'

export {
    Input,
}
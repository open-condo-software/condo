import {
    Input as DefaultInput,
    InputProps as DefaultInputProps,
} from 'antd'
import classNames from 'classnames'
import React, { InputHTMLAttributes, useMemo } from 'react'

import { Close } from '@open-condo/icons'

import type { InputRef } from 'antd/lib/input'


export const INPUT_CLASS_PREFIX = 'condo-input'

export type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'style' | 'size'>
& Pick<DefaultInputProps, 'disabled'>

export type InputProps = BaseInputProps & {
    allowClear?: boolean
    suffix?: string
}

const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<InputRef>> = React.forwardRef((props, ref) => {
    const {
        allowClear: allowClearProp,
        className: propsClassName,
        suffix,
        ...restProps
    } = props

    const allowClear = useMemo(() => {
        if (allowClearProp) {
            return { clearIcon: <Close size='small'/> }
        }

        return false
    }, [allowClearProp])

    const className = classNames(propsClassName, {
        [`${INPUT_CLASS_PREFIX}-with-suffix`]: suffix,
    })

    return <DefaultInput
        {...restProps}
        ref={ref}
        prefixCls={INPUT_CLASS_PREFIX}
        className={className}
        allowClear={allowClear}
        suffix={suffix}
    />
})

Input.displayName = 'Input'

export {
    Input,
}
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
& Pick<DefaultInputProps, 'disabled' | 'suffix'>

export type InputProps = BaseInputProps & {
    allowClear?: boolean
    prefix?: string
}

const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<InputRef>> = React.forwardRef((props, ref) => {
    const {
        allowClear: allowClearProp,
        className: propsClassName,
        suffix,
        prefix,
        ...restProps
    } = props

    const allowClear = useMemo(() => {
        if (allowClearProp) {
            return { clearIcon: <Close size='small'/> }
        }

        return false
    }, [allowClearProp])

    const className = classNames(propsClassName, {
        [`${INPUT_CLASS_PREFIX}-with-prefix`]: prefix,
        [`${INPUT_CLASS_PREFIX}-with-suffix`]: suffix,
    })

    return <DefaultInput
        {...restProps}
        ref={ref}
        prefixCls={INPUT_CLASS_PREFIX}
        className={className}
        allowClear={allowClear}
        suffix={suffix}
        prefix={prefix}
    />
})

Input.displayName = 'Input'

export {
    Input,
}
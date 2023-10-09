import classNames from 'classnames'
import React, { useCallback } from 'react'
import ReactPhoneInput from 'react-phone-input-2'

import { INPUT_CLASS_PREFIX } from './input'

import type { PhoneInputProps as DefaultPhoneInputProps } from 'react-phone-input-2'

const DEFAULT_COUNTRY = 'ru'
const DEFAULT_PLACEHOLDER = '7 (999) 123-4567'

export type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'value' | 'onChange'>
& Pick<DefaultPhoneInputProps, 'country' | 'placeholder' | 'onChange' | 'value'>

const Phone: React.FC<PhoneInputProps> = (props) => {
    const { country, placeholder, onChange, disabled = false, ...restProps } = props

    const containerClasses = classNames(`${INPUT_CLASS_PREFIX}-phone`, {
        [`${INPUT_CLASS_PREFIX}-phone-disabled`]: disabled,
    })

    const internalOnChange = useCallback<Required<PhoneInputProps>['onChange']>((rawValue, data, event, formattedValue) => {
        const value = rawValue ? `+${rawValue}` : rawValue
        if (onChange) {
            onChange(value, data, event, formattedValue)
        }
    }, [onChange])

    return (
        <ReactPhoneInput
            {...restProps}
            onChange={internalOnChange}
            containerClass={containerClasses}
            disabled={disabled}
            inputClass={INPUT_CLASS_PREFIX}
            country={country || DEFAULT_COUNTRY}
            copyNumbersOnly={false}
            placeholder={placeholder || DEFAULT_PLACEHOLDER}
        />
    )
}

Phone.displayName = 'PhoneInput'

export {
    Phone,
}
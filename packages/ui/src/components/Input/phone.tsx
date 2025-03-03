import classNames from 'classnames'
import React, { useCallback, useMemo } from 'react'
import ReactPhoneInput from 'react-phone-input-2'

import { INPUT_CLASS_PREFIX } from './input'

import type { PhoneInputProps as DefaultPhoneInputProps } from 'react-phone-input-2'

const DEFAULT_COUNTRY = 'ru'
const DEFAULT_PLACEHOLDER = '7 (999) 123-4567'

export type PhoneInputProps = Pick<DefaultPhoneInputProps,
'country'
| 'placeholder'
| 'onChange'
| 'value'
| 'onMount'
| 'disabled'> & {
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'value' | 'onChange'>
    id?: string
}

const Phone: React.FC<PhoneInputProps> = (props) => {
    const { country, placeholder, onChange, disabled = false, id, inputProps, ...restProps } = props

    const containerClasses = classNames(`${INPUT_CLASS_PREFIX}-phone`, {
        [`${INPUT_CLASS_PREFIX}-phone-disabled`]: disabled,
    })

    const internalOnChange = useCallback<Required<PhoneInputProps>['onChange']>((rawValue, data, event, formattedValue) => {
        const value = rawValue ? `+${rawValue}` : rawValue
        if (onChange) {
            onChange(value, data, event, formattedValue)
        }
    }, [onChange])

    const combinedInputProps = useMemo(() => {
        const props = { ...inputProps }
        if (id) {
            props.id = id
        }
        return props
    }, [id, inputProps])

    return (
        <ReactPhoneInput
            {...restProps}
            inputProps={combinedInputProps}
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
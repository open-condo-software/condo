import ConfigProvider, { defaultPrefixCls } from 'antd/es/config-provider'
import PhoneInput from 'antd-phone-input'
import { PhoneInputProps as DefaultPhoneInputProps } from 'antd-phone-input/types'
import React, { cloneElement, useCallback } from 'react'
import { getFormattedNumber, getMetadata } from 'react-phone-hooks'

import { SELECT_CLASS_PREFIX } from '../Select/select'

export type PhoneInputProps = Omit<DefaultPhoneInputProps, 'onChange'> & {
    onChange?: (value: string, data: { countryCode: any }, event: React.ChangeEvent<HTMLInputElement>, formattedValue: string) => void
}

const DEFAULT_COUNTRY = 'ru'
const DEFAULT_PLACEHOLDER = '7 (999) 123-4567'

const Phone: React.FC<PhoneInputProps> = (props) => {
    const { country, placeholder, onChange, disabled = false, ...restProps } = props

    const internalOnChange = useCallback<Required<DefaultPhoneInputProps>['onChange']>(({ countryCode, areaCode, phoneNumber, isoCode }, event) => {
        const data = { countryCode: isoCode }
        const value = `${countryCode}${areaCode || ''}${phoneNumber || ''}`
        const formattedValue = getFormattedNumber(value, getMetadata(value)?.[3] as string)
        if (onChange) {
            onChange(value, data, event, formattedValue)
        }
    }, [onChange])

    return (
        <ConfigProvider prefixCls='condo'>
            <PhoneInput
                {...restProps}
                disabled={disabled}
                onChange={internalOnChange}
                country={country as any || DEFAULT_COUNTRY}
                placeholder={placeholder || DEFAULT_PLACEHOLDER}
                dropdownRender={(menu) => (
                    <ConfigProvider prefixCls={defaultPrefixCls}>
                        {cloneElement(menu as any, { prefixCls: SELECT_CLASS_PREFIX })}
                    </ConfigProvider>
                )}
            />
        </ConfigProvider>
    )
}

Phone.displayName = 'PhoneInput'

export {
    Phone,
}
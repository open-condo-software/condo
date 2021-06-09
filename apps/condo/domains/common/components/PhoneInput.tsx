import { InputProps } from 'antd'
import React, { useCallback } from 'react'
import ReactPhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'

interface IPhoneInputProps extends InputProps {
    autoFormat?: boolean
}

export const PhoneInput: React.FC<IPhoneInputProps> = (props) => {
    const { value, placeholder, style, disabled } = props
    const { organization } = useOrganization()

    const userOrganizationCountry = get(organization, 'country', 'ru')

    const onChange = useCallback((value) => {
        props.onChange(value ? '+' + value : value)
    }, [])

    return (
        <ReactPhoneInput
            inputClass={'ant-input'}
            value={String(value)}
            country={userOrganizationCountry}
            onChange={onChange}
            disabled={disabled}
            inputStyle={style}
            placeholder={placeholder}
        />
    )
}

import { InputProps } from 'antd'
import React, { useCallback, useRef, useImperativeHandle } from 'react'
import ReactPhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'

interface IPhoneInputProps extends InputProps {
    autoFormat?: boolean,
    /*
        Make this component compatible with `AutoComplete` component, when used as a custom input.
     */
    compatibilityWithAntAutoComplete?: boolean,
}

interface PhoneInputRef {
    numberInputRef: {
        focus: () => void,
    },
}

export const PhoneInput: React.FC<IPhoneInputProps> = React.forwardRef((props, ref) => {
    const { value, placeholder, style, disabled, ...otherProps } = props
    const { organization } = useOrganization()
    const inputRef = useRef<PhoneInputRef>()

    // `AutoComplete` component needs `focus` method of it's direct child component (custom input)
    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current.numberInputRef.focus()
        },
    }))

    const userOrganizationCountry = get(organization, 'country', 'ru')

    const onChange = (value) => {
        const formattedValue = value ? '+' + value : value
        if (props.compatibilityWithAntAutoComplete) {
            /*
                `AutoComplete` component uses `rc-select` under the hood, which expects to have
                `onChange` been called with InputEvent object as an argument, but input from `react-phone-input-2`
                calls `onChange` with a String value, for example, here:
                https://github.com/bl00mber/react-phone-input-2/blob/9deb73afdde6d631ab6e7af9544a31a9ff176b3b/src/index.js#L589
                This breaks the code.
                So, just give, what `rc-select/Selector` needs inside of `AutoComplete`.
            */
            const event = {
                target: {
                    value: formattedValue,
                },
            }
            // @ts-ignore
            props.onChange(event)
        } else {
            props.onChange(formattedValue)
        }
    }

    return (
        <ReactPhoneInput
            {...otherProps}
            // @ts-ignore
            ref={inputRef}
            inputClass={'ant-input'}
            value={String(value)}
            country={userOrganizationCountry}
            onChange={onChange}
            disabled={disabled}
            inputStyle={style}
            placeholder={placeholder}
        />
    )
})
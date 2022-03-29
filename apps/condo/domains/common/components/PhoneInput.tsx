import { ConfigProvider, InputProps } from 'antd'
import { SizeType } from 'antd/es/config-provider/SizeContext'
import React, {
    useRef,
    useImperativeHandle,
    useEffect,
    ComponentProps,
    useContext,
    useCallback,
    useMemo,
    forwardRef,
} from 'react'
import ReactPhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { useOrganization } from '@core/next/organization'
import get from 'lodash/get'
import { colors } from '@condo/domains/common/constants/style'

interface IPhoneInputProps extends InputProps {
    block?: boolean
    autoFormat?: boolean
    /*
        Make this component compatible with `AutoComplete` component, when used as a custom input.
     */
    compatibilityWithAntAutoComplete?: boolean,
}

type PhoneInputRef = {
    numberInputRef: {
        focus: () => void,
    } & ComponentProps<'input'>,
}

const getPhoneInputStyles = (style, size: SizeType, block?: boolean) => {
    let height = '32px'

    if (size === 'large') {
        height = '48px'
    } else if (size === 'small') {
        height = '22px'
    }

    let computedStyles = { ...style, height }

    if (block) {
        computedStyles = { ...computedStyles, width: '100%' }
    }

    return computedStyles
}

const BUTTON_INPUT_PHONE_STYLE: React.CSSProperties = { margin: 5, backgroundColor: colors.backgroundWhiteSecondary, border: 0, borderRadius: 8 }

export const PhoneInput: React.FC<IPhoneInputProps> = forwardRef((props, ref) => {
    const { value, placeholder, style, disabled, block, ...otherProps } = props
    const configSize = useContext<SizeType>(ConfigProvider.SizeContext)
    const { organization } = useOrganization()
    const userOrganizationCountry = get(organization, 'country', 'ru')
    const inputRef = useRef<PhoneInputRef>()

    // `AutoComplete` component needs `focus` method of it's direct child component (custom input)
    useImperativeHandle(ref, () => ({
        focus: () => {
            inputRef.current.numberInputRef.focus()
        },
    }))

    useEffect(() => {
        inputRef.current.numberInputRef.tabIndex = props.tabIndex
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onChange = useCallback((value) => {
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
    }, [props.onChange])

    const inputStyles = useMemo(() => {
        return getPhoneInputStyles(style, configSize, block)
    }, [style, configSize, block])

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
            inputStyle={inputStyles}
            placeholder={placeholder}
            buttonStyle={BUTTON_INPUT_PHONE_STYLE}
        />
    )
})

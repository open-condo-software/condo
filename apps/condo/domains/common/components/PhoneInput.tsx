import { ConfigProvider } from 'antd'
import { SizeType } from 'antd/es/config-provider/SizeContext'
import get from 'lodash/get'
import getConfig from 'next/config'
import React, {
    useRef,
    useImperativeHandle,
    useEffect,
    ComponentProps,
    useContext,
    useCallback,
    useMemo,
    forwardRef, CSSProperties,
} from 'react'
import { useIntl } from 'react-intl'
import ReactPhoneInput, { PhoneInputProps } from 'react-phone-input-2'
import es from 'react-phone-input-2/lang/es.json'
import ru from 'react-phone-input-2/lang/ru.json'


import { useOrganization } from '@open-condo/next/organization'

import { colors } from '@condo/domains/common/constants/style'

import { RU_LOCALE, ES_LOCALE } from '../constants/locale'


interface IPhoneInputProps extends Omit<PhoneInputProps, 'onChange'> {
    block?: boolean
    autoFormat?: boolean
    autoFocus?: boolean
    /*
        Make this component compatible with `AutoComplete` component, when used as a custom input.
     */
    compatibilityWithAntAutoComplete?: boolean
    masks?: { ru?: string }

    style?: CSSProperties
    tabIndex?: number
    onChange?: (data) => void
    allowClear?: boolean
    showCountryPrefix?: boolean
}

type PhoneInputRef = {
    numberInputRef: {
        focus: () => void
    } & ComponentProps<'input'>
}

const { publicRuntimeConfig: { defaultLocale } } = getConfig()

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

const getPhoneLocalization = (locale: string) => {
    if (locale === ES_LOCALE) {
        return es
    }
    if (locale === RU_LOCALE) {
        return ru
    }
    return {}
}

/**
 * @deprecated use Input.Phone from Condo UI Kit
 */
export const PhoneInput: React.FC<IPhoneInputProps> = forwardRef((props, ref) => {
    const { value, placeholder, style, disabled, block, showCountryPrefix = true, country, autoFocus, ...otherProps } = props
    const configSize = useContext<SizeType>(ConfigProvider.SizeContext)
    const { organization } = useOrganization()
    const userOrganizationCountry = showCountryPrefix && get(organization, 'country', defaultLocale)
    const countryFromProps = showCountryPrefix && country
    const inputRef = useRef<PhoneInputRef>()

    const intl = useIntl()
    const locale = intl.locale
    /*
     * For custom inputs `AutoComplete` component needs that inputRef.current will be equal to event.target,
     * otherwise in the onMouseDown event (in rc-select/Selector) the preventDefault will work
     */
    useImperativeHandle(ref, () => inputRef.current.numberInputRef)

    useEffect(() => {
        inputRef.current.numberInputRef.tabIndex = props.tabIndex
    }, [props.tabIndex])

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
            props.onChange(event)
        } else {
            props.onChange(formattedValue)
        }
    }, [props.onChange])

    const inputStyles = useMemo(() => {
        return getPhoneInputStyles(style, configSize, block)
    }, [style, configSize, block])

    const phoneLocalization = useMemo(() => {
        return getPhoneLocalization(locale)
    }, [locale])

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current?.numberInputRef?.focus()
        }
    }, [autoFocus])

    return (
        <ReactPhoneInput
            {...otherProps}
            // @ts-ignore
            ref={inputRef}
            inputClass='ant-input'
            value={String(value)}
            country={countryFromProps || userOrganizationCountry}
            onChange={onChange}
            disabled={disabled}
            inputStyle={inputStyles}
            placeholder={placeholder}
            buttonStyle={BUTTON_INPUT_PHONE_STYLE}
            copyNumbersOnly={false}
            localization={phoneLocalization}
        />
    )
})

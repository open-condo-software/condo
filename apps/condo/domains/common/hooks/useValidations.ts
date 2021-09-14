import { useIntl } from '@core/next/intl'
import { Rule } from 'rc-field-form/lib/interface'
const { normalizePhone } = require('@condo/domains/common/utils/phone')

type ValidatorTypes = {
    changeMessage: (rule: Rule, message: string) => Rule
    requiredValidator: Rule
    phoneValidator: Rule
    emailValidator: Rule
    trimValidator: Rule
    minLengthValidator: (length: number) => Rule
    numberValidator: Rule
}

const changeMessage = (rule: Rule, message: string) => {
    return { ...rule, message }
}

export const useValidations: () => ValidatorTypes = () => {
    const intl = useIntl()
    const ThisFieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const PhoneIsNotValidMessage = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const FieldIsTooShortMessage = intl.formatMessage({ id: 'ValueIsTooShort' })
    const NumberIsNotValidMessage = intl.formatMessage({ id: 'NumberIsNotValid' })

    const requiredValidator: Rule = {
        required: true,
        message: ThisFieldIsRequiredMessage,
    }

    const phoneValidator: Rule = {
        validator: (_, value) => {
            if (!value) return Promise.resolve()
            const v = normalizePhone(value)
            if (!v) return Promise.reject(PhoneIsNotValidMessage)
            return Promise.resolve()
        },
    }

    const emailValidator: Rule = {
        type: 'email',
        message: EmailErrorMessage,
    }

    const trimValidator: Rule = {
        validator: (_, value) => {
            if (!value || value.trim().length === 0) return Promise.reject(ThisFieldIsRequiredMessage)
            return Promise.resolve()
        },
    }

    const minLengthValidator: (length: number) => Rule = (length) => {
        return {
            min: length,
            message: FieldIsTooShortMessage,
        }
    }

    const numberValidator: Rule = {
        pattern: /^\d+(\.?\d+)?$/g,
        message: NumberIsNotValidMessage,
    }

    return {
        changeMessage,
        requiredValidator,
        phoneValidator,
        emailValidator,
        trimValidator,
        minLengthValidator,
        numberValidator,
    }
}
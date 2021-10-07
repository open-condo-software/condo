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
    maxLengthValidator: (length: number) => Rule
    lessThanValidator: (comparedValue: number, errorMessage: string) => Rule
    greaterThanValidator: (comparedValue: number, errorMessage: string, delta?: number) => Rule
    numberValidator: Rule
}

const changeMessage = (rule: Rule, message: string) => {
    return { ...rule, message }
}

type ValidationSettings = {
    allowLandLine?: boolean;
}

type UseValidations = (settings?: ValidationSettings) => ValidatorTypes

export const useValidations: UseValidations = (settings) => {
    const intl = useIntl()
    const ThisFieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const PhoneIsNotValidMessage = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const FieldIsTooShortMessage = intl.formatMessage({ id: 'ValueIsTooShort' })
    const FieldIsTooLongMessage = intl.formatMessage({ id: 'ValueIsTooLong' })
    const NumberIsNotValidMessage = intl.formatMessage({ id: 'NumberIsNotValid' })
    const { allowLandLine } = settings ?? {}

    const requiredValidator: Rule = {
        required: true,
        message: ThisFieldIsRequiredMessage,
    }

    const phoneValidator: Rule = {
        validator: (_, value) => {
            if (!value) return Promise.resolve()
            const v = normalizePhone(value, allowLandLine)
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

    const maxLengthValidator: (length: number) => Rule = (length) => {
        return {
            max: length,
            message: FieldIsTooLongMessage,
        }
    }

    const numberValidator: Rule = {
        validator: (_, value: string) => {
            const normalizedValue = value?.replace(',', '.')
            if (normalizedValue && !normalizedValue.match(/^\d+(\.?\d+)?$/g))
                return Promise.reject(NumberIsNotValidMessage)

            return Promise.resolve()
        },
    }

    const lessThanValidator: (comparedValue: number, errorMessage: string) => Rule =
        (comparedValue, errorMessage) => {
            return {
                validator: (_, value: string | number) => {
                    let normalizedValue = value
                    if (typeof value === 'string')
                        normalizedValue = value.replace(',', '.')

                    if (value !== '' && Number(normalizedValue) < Number(comparedValue))
                        return Promise.reject(errorMessage)

                    return Promise.resolve()
                },
            }
        }

    const greaterThanValidator: (comparedValue: number, errorMessage: string, delta?: number) => Rule =
        (comparedValue, errorMessage, delta = 0) => {
            return {
                validator: (_, value: number | string) => {
                    let normalizedValue = value
                    if (typeof value === 'string')
                        normalizedValue = value.replace(',', '.')

                    if (value !== '' && Number(normalizedValue) > comparedValue + delta)
                        return Promise.reject(errorMessage)

                    return Promise.resolve()
                },
            }
        }

    return {
        changeMessage,
        requiredValidator,
        phoneValidator,
        emailValidator,
        trimValidator,
        lessThanValidator,
        greaterThanValidator,
        minLengthValidator,
        maxLengthValidator,
        numberValidator,
    }
}
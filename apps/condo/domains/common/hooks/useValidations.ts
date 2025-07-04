import { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { SPECIAL_CHAR_REGEXP, MULTIPLE_EMAILS_REGEX } from '@condo/domains/common/constants/regexps'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { isValidTin } from '@condo/domains/organization/utils/tin.utils'

import type { FormRule } from 'antd'


type ValidatorTypes = {
    changeMessage: (rule: FormRule, message: string) => FormRule
    requiredValidator: FormRule
    phoneValidator: FormRule
    emailValidator: FormRule
    trimValidator: FormRule
    specCharValidator: FormRule
    minLengthValidator: (length: number) => FormRule
    maxLengthValidator: (length: number, errorMessage?: string) => FormRule
    lessThanValidator: (comparedValue: number, errorMessage: string) => FormRule
    greaterThanValidator: (comparedValue: number, errorMessage: string, delta?: number) => FormRule
    numberValidator: FormRule
    tinValidator: (country: string) => FormRule
    multipleEmailsValidator: (emails: string) => FormRule
}

const changeMessage = (rule: FormRule, message: string) => {
    return { ...rule, message }
}

type ValidationSettings = {
    allowLandLine?: boolean
}

type UseValidations = (settings?: ValidationSettings) => ValidatorTypes

export const useValidations: UseValidations = (settings = {}) => {
    const intl = useIntl()
    const ThisFieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const MobilePhoneIsNotValidMessage = intl.formatMessage({ id: 'global.input.error.wrongMobilePhone' })
    const PhoneIsNotValidMessage = intl.formatMessage({ id: 'global.input.error.wrongPhone' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const FieldIsTooShortMessage = intl.formatMessage({ id: 'ValueIsTooShort' })
    const FieldIsTooLongMessage = intl.formatMessage({ id: 'ValueIsTooLong' })
    const NumberIsNotValidMessage = intl.formatMessage({ id: 'NumberIsNotValid' })
    const TinValueIsInvalidMessage = intl.formatMessage({ id: 'pages.organizations.tin.InvalidValue' })
    const EmailsAreInvalidMessage = intl.formatMessage({ id: 'global.input.error.wrongEmails' })

    const { allowLandLine } = settings

    const requiredValidator: FormRule = useMemo(() => ({
        required: true,
        message: ThisFieldIsRequiredMessage,
    }), [ThisFieldIsRequiredMessage])

    const phoneValidator: FormRule = useMemo(() => ({
        validator: (_, value) => {
            if (!value) return Promise.resolve()
            const v = normalizePhone(value, allowLandLine)
            if (!v) return Promise.reject(allowLandLine ? PhoneIsNotValidMessage : MobilePhoneIsNotValidMessage)
            return Promise.resolve()
        },
    }), [MobilePhoneIsNotValidMessage, PhoneIsNotValidMessage, allowLandLine])

    const emailValidator: FormRule = useMemo(() => ({
        type: 'email',
        message: EmailErrorMessage,
    }), [EmailErrorMessage])

    const trimValidator: FormRule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || value.trim().length === 0) return Promise.reject(ThisFieldIsRequiredMessage)
            return Promise.resolve()
        },
    }), [ThisFieldIsRequiredMessage])

    const specCharValidator: FormRule = useMemo(() => ({
        validator: (_, value) => {
            if (value) {
                if (SPECIAL_CHAR_REGEXP.test(value)) return Promise.reject()
            } else {
                return Promise.reject()
            }
            return Promise.resolve()
        },
    }), [])

    const minLengthValidator: (length: number) => FormRule = useCallback((length) => {
        return {
            min: length,
            message: FieldIsTooShortMessage,
        }
    }, [FieldIsTooShortMessage])

    const maxLengthValidator: (length: number, errorMessage?: string) => FormRule = useCallback((length, errorMessage) => {
        const message = errorMessage ? errorMessage : FieldIsTooLongMessage

        return {
            max: length,
            message,
        }
    }, [FieldIsTooLongMessage])

    // TODO (DOMA-1725): Replace this with normal validations
    const numberValidator: FormRule = useMemo(() => ({
        validator: (_, value: string) => {
            const normalizedValue = value?.replace(',', '.')
            if (normalizedValue && !normalizedValue.match(/^\d+(\.?\d+)?$/g))
                return Promise.reject(NumberIsNotValidMessage)

            return Promise.resolve()
        },
    }), [NumberIsNotValidMessage])

    const lessThanValidator: (comparedValue: number, errorMessage: string) => FormRule =
        useCallback((comparedValue, errorMessage) => {
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
        }, [])

    const greaterThanValidator: (comparedValue: number, errorMessage: string, delta?: number) => FormRule =
        useCallback((comparedValue, errorMessage, delta = 0) => {
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
        }, [])

    const tinValidator: (country: string) => FormRule =
        useCallback((country) => {
            return {
                validator: (_, value: string) => {
                    if (isValidTin(value, country)) return Promise.resolve()

                    return Promise.reject(TinValueIsInvalidMessage)
                },
            }
        }, [TinValueIsInvalidMessage])

    const multipleEmailsValidator: (emails: string) => FormRule =
        useCallback((emails) => {
            return {
                validator: () => {
                    if (!MULTIPLE_EMAILS_REGEX.test(emails) && emails !== '') return Promise.reject(EmailsAreInvalidMessage)

                    return Promise.resolve()
                },
            }
        }, [EmailsAreInvalidMessage])


    return useMemo(() => ({
        changeMessage,
        requiredValidator,
        phoneValidator,
        emailValidator,
        trimValidator,
        specCharValidator,
        lessThanValidator,
        greaterThanValidator,
        minLengthValidator,
        maxLengthValidator,
        numberValidator,
        tinValidator,
        multipleEmailsValidator,
    }), [emailValidator, greaterThanValidator, lessThanValidator, maxLengthValidator, minLengthValidator, multipleEmailsValidator, numberValidator, phoneValidator, requiredValidator, specCharValidator, tinValidator, trimValidator])
}
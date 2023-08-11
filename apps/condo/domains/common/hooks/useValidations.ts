import { Rule } from 'rc-field-form/lib/interface'

import { useIntl } from '@open-condo/next/intl'

import { SPECIAL_CHAR_REGEXP, MULTIPLE_EMAILS_REGEX } from '@condo/domains/common/constants/regexps'
import { normalizePhone } from '@condo/domains/common/utils/phone'
import { isValidTin } from '@condo/domains/organization/utils/tin.utils'

type ValidatorTypes = {
    changeMessage: (rule: Rule, message: string) => Rule
    requiredValidator: Rule
    phoneValidator: Rule
    emailValidator: Rule
    trimValidator: Rule
    specCharValidator: Rule
    minLengthValidator: (length: number) => Rule
    maxLengthValidator: (length: number, errorMessage?: string) => Rule
    lessThanValidator: (comparedValue: number, errorMessage: string) => Rule
    greaterThanValidator: (comparedValue: number, errorMessage: string, delta?: number) => Rule
    numberValidator: Rule
    tinValidator: (country: string) => Rule
    multipleEmailsValidator: (emails: string) => Rule
}

const changeMessage = (rule: Rule, message: string) => {
    return { ...rule, message }
}

type ValidationSettings = {
    allowLandLine?: boolean;
}

type UseValidations = (settings?: ValidationSettings) => ValidatorTypes

// TODO(DOMA-1588): Add memoization for hook members to prevent unnecessary rerenders
export const useValidations: UseValidations = (settings = {}) => {
    const intl = useIntl()
    const ThisFieldIsRequiredMessage = intl.formatMessage({ id: 'fieldIsRequired' })
    const MobilePhoneIsNotValidMessage = intl.formatMessage({ id: 'global.input.error.wrongMobilePhone' })
    const PhoneIsNotValidMessage = intl.formatMessage({ id: 'global.input.error.wrongPhone' })
    const EmailErrorMessage = intl.formatMessage({ id: 'auth.emailIsNotValid' })
    const FieldIsTooShortMessage = intl.formatMessage({ id: 'valueIsTooShort' })
    const FieldIsTooLongMessage = intl.formatMessage({ id: 'valueIsTooLong' })
    const NumberIsNotValidMessage = intl.formatMessage({ id: 'numberIsNotValid' })
    const TinValueIsInvalidMessage = intl.formatMessage({ id: 'organizations.tin.invalidValue' })
    const EmailsAreInvalidMessage = intl.formatMessage({ id: 'global.input.error.wrongEmails' })

    const { allowLandLine } = settings

    const requiredValidator: Rule = {
        required: true,
        message: ThisFieldIsRequiredMessage,
    }

    const phoneValidator: Rule = {
        validator: (_, value) => {
            if (!value) return Promise.resolve()
            const v = normalizePhone(value, allowLandLine)
            if (!v) return Promise.reject(allowLandLine ? PhoneIsNotValidMessage : MobilePhoneIsNotValidMessage)
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

    const specCharValidator: Rule = {
        validator: (_, value) => {
            if (value) {
                if (SPECIAL_CHAR_REGEXP.test(value)) return Promise.reject()
            } else {
                return Promise.reject()
            }
            return Promise.resolve()
        },
    }

    const minLengthValidator: (length: number) => Rule = (length) => {
        return {
            min: length,
            message: FieldIsTooShortMessage,
        }
    }

    const maxLengthValidator: (length: number, errorMessage?: string) => Rule = (length, errorMessage) => {
        const message = errorMessage ? errorMessage : FieldIsTooLongMessage

        return {
            max: length,
            message,
        }
    }

    // TODO (DOMA-1725): Replace this with normal validations
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

    const tinValidator: (country: string) => Rule =
        (country) => {
            return {
                validator: (_, value: string) => {
                    if (isValidTin(value, country)) return Promise.resolve()

                    return Promise.reject(TinValueIsInvalidMessage)
                },
            }
        }

    const multipleEmailsValidator: (emails: string) => Rule =
        (emails) => {
            return {
                validator: () => {
                    if (!MULTIPLE_EMAILS_REGEX.test(emails) && emails !== '') return Promise.reject(EmailsAreInvalidMessage)

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
        specCharValidator,
        lessThanValidator,
        greaterThanValidator,
        minLengthValidator,
        maxLengthValidator,
        numberValidator,
        tinValidator,
        multipleEmailsValidator,
    }
}

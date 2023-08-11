import { Rule } from 'rc-field-form/lib/interface'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'

type ValidatorsMap = {
    [key: string]: Rule[]
}

export const useRegisterFormValidators = () => {
    const intl = useIntl()
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'auth.pleaseInputYourPassword' })
    const PleaseInputYourNameMsg = intl.formatMessage({ id: 'auth.pleaseInputYourName' })
    const EmailIsNotValidMsg = intl.formatMessage({ id: 'auth.emailIsNotValid' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'auth.pleaseConfirmYourPassword' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'auth.twoPasswordDontMatch' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'auth.passwordIsTooShort' })
    const NameMustContainMsg = intl.formatMessage({ id: 'auth.nameMustContain' })
    const NameMustNotStartOrAndMsg = intl.formatMessage({ id: 'auth.nameMustNotStartOrAnd' })
    const NameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })

    return useMemo<ValidatorsMap>(() => {
        return {
            phone: [{ required: true }],
            name: [
                {
                    required: true,
                    message: PleaseInputYourNameMsg,
                    whitespace: true,
                    type: 'string',
                }, {
                    message: NameInvalidCharMessage,
                    // NOTE(pahaz): test it here https://regex101.com/r/sIntkL/1
                    pattern: /^([\p{L}-][ ]?)+$/ug,
                }, {
                    message: NameMustContainMsg,
                    pattern: /\p{L}+/u,
                }, {
                    message: NameMustNotStartOrAndMsg,
                    validator: (_, value) => !/[-]\s|\s[-]/.test(value && value.trim()) ? Promise.resolve() : Promise.reject(),
                },
            ],
            email: [
                {
                    type: 'email',
                    message: EmailIsNotValidMsg,
                },
            ],
            password: [
                {
                    required: true,
                    message: PleaseInputYourPasswordMsg,
                },
                {
                    min: MIN_PASSWORD_LENGTH,
                    message: PasswordIsTooShortMsg,
                },
            ],
            confirm: [
                {
                    required: true,
                    message: PleaseConfirmYourPasswordMsg,
                },
                ({ getFieldValue }) => ({
                    validator (_, value) {
                        if (!value || getFieldValue('password') === value) {
                            return Promise.resolve()
                        }
                        return Promise.reject(TwoPasswordDontMatchMsg)
                    },
                }),
            ],
        }
    }, [intl])
}

import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'

import type { FormRule as Rule } from 'antd'

type ValidatorsMap = {
    [key: string]: Rule[]
}

export const useRegisterFormValidators = () => {
    const intl = useIntl()
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PleaseInputYourNameMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourName' })
    const EmailIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' }, { min: MIN_PASSWORD_LENGTH })
    const NameMustContainMsg = intl.formatMessage({ id: 'pages.auth.NameMustContain' })
    const NameMustNotStartOrAndMsg = intl.formatMessage({ id: 'pages.auth.NameMustNotStartOrAnd' })
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

import { Rule } from 'rc-field-form/lib/interface'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'

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
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const NameContainsOnlyMsg = intl.formatMessage({ id: 'pages.auth.NameContainsOnly' })
    const NameMustContainMsg = intl.formatMessage({ id: 'pages.auth.NameMustContain' })
    const NameMustNotStartOrAndMsg = intl.formatMessage({ id: 'pages.auth.NameMustNotStartOrAnd' })

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
                    message: NameContainsOnlyMsg,
                    pattern: /^([a-zA-Zа-яА-ЯЁё\s][-'’`]?)+$/,
                }, {
                    message: NameMustContainMsg,
                    pattern: /[a-zA-Zа-яА-ЯЁё]+/,
                }, {
                    message: NameMustNotStartOrAndMsg,
                    validator: (_, value) => !/^[-'’`]|[-'’`]$/.test(value && value.trim()) ? Promise.resolve() : Promise.reject(),
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

import { Rule } from 'rc-field-form/lib/interface'
import { useIntl } from '@core/next/intl'
import { MIN_PASSWORD_LENGTH } from '../constants/common'

type IFormFieldsRuleMap = {
    [key: string]: Rule[]
}

export function usePasswordUpdateValidations (): IFormFieldsRuleMap {
    const intl = useIntl()
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })

    const commonPasswordFieldValidator = [
        {
            required: true,
            message: PleaseInputYourPasswordMsg,
        },
        {
            min: MIN_PASSWORD_LENGTH,
            message: PasswordIsTooShortMsg,
        },
    ]

    return {
        oldPassword: commonPasswordFieldValidator,
        newPassword: commonPasswordFieldValidator,
        newPasswordRetry: [
            ...commonPasswordFieldValidator,
            ({ getFieldValue }) => ({
                validator (_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                    }
                    return Promise.reject(new Error(intl.formatMessage({ id: 'passwordChangeForm.passwordsDidntMatch' })))
                },
            }),
        ],
    }
}

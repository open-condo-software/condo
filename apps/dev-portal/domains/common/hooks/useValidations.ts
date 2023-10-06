import { Rule } from 'rc-field-form/lib/interface'
import { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { isValidPassword } from '@dev-api/domains/user/utils/password'
import { normalizePhone } from '@dev-api/domains/user/utils/phone'


type Validators = {
    requiredValidator: Rule
    phoneFormatValidator: Rule
    passwordValidator: Rule
    trimValidator: Rule
}

export function useValidations (): Validators {
    const intl = useIntl()
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'global.forms.validations.required.message' })
    const InvalidPhoneMessage = intl.formatMessage({ id: 'global.forms.validations.phoneFormat.message' })
    const PasswordIsTooEasyMessage = intl.formatMessage({ id: 'global.forms.validations.passwordTooEasy.message' })

    const requiredValidator: Rule = useMemo(() => ({
        required: true,
        message: FieldIsRequiredMessage,
    }), [FieldIsRequiredMessage])

    const trimValidator: Rule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || !value.trim().length) return Promise.reject(FieldIsRequiredMessage)
            return Promise.resolve()
        },
        message: FieldIsRequiredMessage,
    }), [FieldIsRequiredMessage])

    const phoneFormatValidator: Rule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || !normalizePhone(value)) return Promise.reject(InvalidPhoneMessage)
            return Promise.resolve()
        },
    }), [InvalidPhoneMessage])

    const passwordValidator: Rule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || !isValidPassword(value)) return Promise.reject(PasswordIsTooEasyMessage)
            return Promise.resolve()
        },
    }), [PasswordIsTooEasyMessage])



    return {
        requiredValidator,
        phoneFormatValidator,
        passwordValidator,
        trimValidator,
    }
}
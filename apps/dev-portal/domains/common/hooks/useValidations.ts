import { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { isValidPassword } from '@dev-api/domains/user/utils/password'
import { normalizePhone } from '@dev-api/domains/user/utils/phone'

import type { Rule } from 'rc-field-form/lib/interface'


type Validators = {
    requiredFieldValidator: Rule
    requiredFileValidator: Rule
    phoneFormatValidator: Rule
    passwordValidator: Rule
    trimValidator: Rule
}

export function useValidations (): Validators {
    const intl = useIntl()
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'global.forms.validations.fieldRequired.message' })
    const FileIsRequiredMessage = intl.formatMessage({ id: 'global.forms.validations.fileRequired.message' })
    const InvalidPhoneMessage = intl.formatMessage({ id: 'global.forms.validations.phoneFormat.message' })
    const PasswordIsTooEasyMessage = intl.formatMessage({ id: 'global.forms.validations.passwordTooEasy.message' })

    const requiredFieldValidator: Rule = useMemo(() => ({
        required: true,
        message: FieldIsRequiredMessage,
    }), [FieldIsRequiredMessage])

    const requiredFileValidator: Rule = useMemo(() => ({
        required: true,
        message: FileIsRequiredMessage,
    }), [FileIsRequiredMessage])

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
        requiredFieldValidator,
        requiredFileValidator,
        phoneFormatValidator,
        passwordValidator,
        trimValidator,
    }
}
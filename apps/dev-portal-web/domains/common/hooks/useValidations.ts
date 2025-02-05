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
    emailValidator: Rule
    trimValidator: Rule
    urlValidator: Rule
}

export function useValidations (): Validators {
    const intl = useIntl()
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'global.forms.validations.fieldRequired.message' })
    const FileIsRequiredMessage = intl.formatMessage({ id: 'global.forms.validations.fileRequired.message' })
    const InvalidPhoneMessage = intl.formatMessage({ id: 'global.forms.validations.phoneFormat.message' })
    const PasswordIsTooEasyMessage = intl.formatMessage({ id: 'global.forms.validations.passwordTooEasy.message' })
    const NotAnUrlMessage = intl.formatMessage({ id: 'global.forms.validations.notAnUrl.message' })
    const NotAnEmailMessage = intl.formatMessage({ id: 'global.forms.validations.notAnEmail.message' })

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

    const urlValidator: Rule = useMemo(() => ({
        type: 'url',
        message: NotAnUrlMessage,
    }), [NotAnUrlMessage])

    const emailValidator: Rule = useMemo(() => ({
        type: 'email',
        message: NotAnEmailMessage,
    }), [NotAnEmailMessage])



    return {
        requiredFieldValidator,
        requiredFileValidator,
        phoneFormatValidator,
        passwordValidator,
        emailValidator,
        trimValidator,
        urlValidator,
    }
}
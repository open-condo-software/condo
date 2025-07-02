import { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { isValidPassword } from '@dev-portal-api/domains/user/utils/password'
import { normalizePhone } from '@dev-portal-api/domains/user/utils/phone'

import type { FormRule } from 'antd'

type Validators = {
    requiredFieldValidator: FormRule
    requiredFileValidator: FormRule
    phoneFormatValidator: FormRule
    passwordValidator: FormRule
    emailValidator: FormRule
    trimValidator: FormRule
    urlValidator: FormRule
}

export function useValidations (): Validators {
    const intl = useIntl()
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'global.forms.validations.fieldRequired.message' })
    const FileIsRequiredMessage = intl.formatMessage({ id: 'global.forms.validations.fileRequired.message' })
    const InvalidPhoneMessage = intl.formatMessage({ id: 'global.forms.validations.phoneFormat.message' })
    const PasswordIsTooEasyMessage = intl.formatMessage({ id: 'global.forms.validations.passwordTooEasy.message' })
    const NotAnUrlMessage = intl.formatMessage({ id: 'global.forms.validations.notAnUrl.message' })
    const NotAnEmailMessage = intl.formatMessage({ id: 'global.forms.validations.notAnEmail.message' })

    const requiredFieldValidator: FormRule = useMemo(() => ({
        required: true,
        message: FieldIsRequiredMessage,
    }), [FieldIsRequiredMessage])

    const requiredFileValidator: FormRule = useMemo(() => ({
        required: true,
        message: FileIsRequiredMessage,
    }), [FileIsRequiredMessage])

    const trimValidator: FormRule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || !value.trim().length) return Promise.reject(FieldIsRequiredMessage)
            return Promise.resolve()
        },
        message: FieldIsRequiredMessage,
    }), [FieldIsRequiredMessage])

    const phoneFormatValidator: FormRule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || !normalizePhone(value)) return Promise.reject(InvalidPhoneMessage)
            return Promise.resolve()
        },
    }), [InvalidPhoneMessage])

    const passwordValidator: FormRule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || !isValidPassword(value)) return Promise.reject(PasswordIsTooEasyMessage)
            return Promise.resolve()
        },
    }), [PasswordIsTooEasyMessage])

    const urlValidator: FormRule = useMemo(() => ({
        type: 'url',
        message: NotAnUrlMessage,
    }), [NotAnUrlMessage])

    const emailValidator: FormRule = useMemo(() => ({
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
import { Col, Row, Form } from 'antd'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Button, Input } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { getClientSideSenderInfo } from '@/domains/common/utils/userid.utils'
import { USER_ALREADY_EXISTS, PASSWORD_TOO_SIMPLE } from '@dev-api/domains/user/constants/errors'

import styles from './IdentityInputStep.module.css'

import type { Rule } from 'rc-field-form/lib/interface'

import { useRegisterNewUserMutation, useSignInMutation } from '@/lib/gql'



const FULL_SPAN_COL = 24
const IDENTITY_FORM_ERRORS_TO_FIELDS_MAP = {
    [USER_ALREADY_EXISTS]: 'phone',
    [PASSWORD_TOO_SIMPLE]: 'password',
}

type IdentityFormValues = {
    name: string
    password: string
}

type IdentityInputStepProps = {
    phone: string
    actionId: string,
    onComplete: () => void
}

export const IdentityInputStep: React.FC<IdentityInputStepProps> = ({ phone, actionId, onComplete }) => {
    const intl = useIntl()
    const NameFieldLabel = intl.formatMessage({ id: 'global.registerForm.labels.name' })
    const NameFieldPlaceholder = intl.formatMessage({ id: 'global.registerForm.placeholders.name' })
    const PhoneFieldLabel = intl.formatMessage({ id: 'global.authForm.labels.phone' })
    const PasswordFieldLabel = intl.formatMessage({ id: 'global.authForm.labels.password' })
    const ConfirmPasswordFieldLabel = intl.formatMessage({ id: 'global.registerForm.confirmPassword' })
    const FinishRegistrationButtonLabel = intl.formatMessage({ id: 'global.registerForm.completeRegistrationButton.label' })
    const PasswordsDontMatchErrorMessage = intl.formatMessage({ id: 'global.registerForm.validations.passwordsDontMatch.message' })

    const [form] = Form.useForm()
    const { trimValidator, passwordValidator } = useValidations()

    const matchingValidator: Rule = {
        validator: (_, value) => {
            const originalValue = form.getFieldValue('password')
            if (originalValue && value !== originalValue) return Promise.reject(PasswordsDontMatchErrorMessage)
            return Promise.resolve()
        },
    }

    const onSignInError = useMutationErrorHandler()
    const onRegisterNewUserError = useMutationErrorHandler({ form, typeToFieldMapping: IDENTITY_FORM_ERRORS_TO_FIELDS_MAP })
    const [registerNewUserMutation] = useRegisterNewUserMutation({ onError: onRegisterNewUserError })
    const [signInMutation] = useSignInMutation({ onError: onSignInError })

    const registerAndLogin = useCallback(async (values: IdentityFormValues) => {
        const data = {
            name: values.name,
            password: values.password,
            dv: 1,
            sender: getClientSideSenderInfo(),
            confirmPhoneActionId: actionId,
        }
        const { data: response } = await registerNewUserMutation({ variables: { data } })
        if (response?.registerNewUser?.id) {
            await signInMutation({ variables: { phone, password: values.password } })
            onComplete()
        }
    }, [registerNewUserMutation, actionId, phone, signInMutation, onComplete])

    return (
        <Form
            name='register-identity'
            layout='vertical'
            requiredMark={false}
            form={form}
            initialValues={{ phone }}
            onFinish={registerAndLogin}
        >
            <Row>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='name' label={NameFieldLabel} required rules={[trimValidator]}>
                        <Input placeholder={NameFieldPlaceholder} autoComplete='off'/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='phone' label={PhoneFieldLabel} required>
                        <Input.Phone disabled/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='password' label={PasswordFieldLabel} required rules={[passwordValidator]}>
                        <Input.Password required autoComplete='new-password'/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='confirm-password' label={ConfirmPasswordFieldLabel} required rules={[matchingValidator]}>
                        <Input.Password required autoComplete='new-password'/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL} className={styles.submitButtonCol}>
                    <Button type='primary' block htmlType='submit'>{FinishRegistrationButtonLabel}</Button>
                </Col>
            </Row>
        </Form>
    )
}
import { Col, Form, Row } from 'antd'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Input, Button } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { INCORRECT_PHONE_OR_PASSWORD } from '@app/dev-portal-api/domains/user/constants/errors'

import styles from './LoginForm.module.css'

import { useSignInMutation } from '@/gql'

const LOGIN_FORM_ERRORS_TO_FIELDS_MAP = {
    [INCORRECT_PHONE_OR_PASSWORD]: 'password',
}

const FULL_SPAN_COL = 24

type LoginFormValues = {
    phone: string
    password: string
}

type LoginFormProps =  {
    onComplete: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onComplete }) => {
    const intl = useIntl()
    const SignInButtonLabel = intl.formatMessage({ id: 'global.actions.signIn' })
    const PhoneLabel = intl.formatMessage({ id: 'global.authForm.items.phone.label' })
    const PasswordLabel = intl.formatMessage({ id: 'global.authForm.items.password.label' })

    const [form] = Form.useForm()
    const onSignInError = useMutationErrorHandler({
        form,
        typeToFieldMapping: LOGIN_FORM_ERRORS_TO_FIELDS_MAP,
    })

    const { requiredFieldValidator, phoneFormatValidator } = useValidations()

    const [signInMutation] = useSignInMutation({
        onCompleted: onComplete,
        onError: onSignInError,
    })

    const onSubmit = useCallback((values: LoginFormValues) => {
        signInMutation({ variables: { phone: values.phone, password: values.password } })
    }, [signInMutation])

    return (
        <Form
            name='login'
            requiredMark={false}
            layout='vertical'
            onFinish={onSubmit}
            form={form}
        >
            <Row>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='phone' label={PhoneLabel} rules={[phoneFormatValidator]}>
                        <Input.Phone/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL}>
                    <Form.Item name='password' label={PasswordLabel} rules={[requiredFieldValidator]}>
                        <Input.Password/>
                    </Form.Item>
                </Col>
                <Col span={FULL_SPAN_COL} className={styles.submitButtonCol}>
                    <Button type='primary' block htmlType='submit'>
                        {SignInButtonLabel}
                    </Button>
                </Col>
            </Row>
        </Form>
    )
}
import { Form, Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Tabs, Input, Button } from '@open-condo/ui'

import { useMutationErrorHandler } from '@/domains/common/hooks/useMutationErrorHandler'
import { useValidations } from '@/domains/common/hooks/useValidations'
import { INCORRECT_PHONE_OR_PASSWORD } from '@dev-api/domains/user/constants/errors'

import styles from './AuthForm.module.css'

import { useSignInMutation } from '@/lib/gql'

const FUL_SPAN_COL = 24

type AuthFormProps =  {
    onComplete: () => void
}

const LOGIN_FORM_ERRORS_TO_FIELDS_MAP = {
    [INCORRECT_PHONE_OR_PASSWORD]: 'password',
}

const LoginForm: React.FC<AuthFormProps> = ({ onComplete }) => {
    const intl = useIntl()
    const SignInButtonLabel = intl.formatMessage({ id: 'global.action.signIn' })
    const PhoneLabel = intl.formatMessage({ id: 'global.authForm.labels.phone' })
    const PasswordLabel = intl.formatMessage({ id: 'global.authForm.labels.password' })

    const [form] = Form.useForm()
    const onSignInError = useMutationErrorHandler({
        form,
        typeToFieldMapping: LOGIN_FORM_ERRORS_TO_FIELDS_MAP,
    })

    const { requiredValidator, phoneFormatValidator } = useValidations()

    const [signInMutation] = useSignInMutation({
        onCompleted: onComplete,
        onError: onSignInError,
    })

    const onSubmit = useCallback((values) => {
        const phone = get(values, 'phone')
        const password = get(values, 'password')
        signInMutation({ variables: { phone, password } })
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
                <Col span={FUL_SPAN_COL}>
                    <Form.Item name='phone' label={PhoneLabel} rules={[phoneFormatValidator]}>
                        <Input.Phone/>
                    </Form.Item>
                </Col>
                <Col span={FUL_SPAN_COL}>
                    <Form.Item name='password' label={PasswordLabel} rules={[requiredValidator]}>
                        <Input.Password/>
                    </Form.Item>
                </Col>
                <Col span={FUL_SPAN_COL} className={styles.submitButtonCol}>
                    <Button type='primary' block htmlType='submit'>
                        {SignInButtonLabel}
                    </Button>
                </Col>
            </Row>
        </Form>
    )
}

export const AuthForm: React.FC<AuthFormProps> = ({ onComplete }) => {
    const intl = useIntl()
    const LoginTabLabel = intl.formatMessage({ id: 'global.authForm.Tabs.login' })
    const RegisterTabLabel = intl.formatMessage({ id: 'global.authForm.Tabs.register' })

    return (
        <Tabs
            centered
            items={[
                {
                    key: 'login',
                    label: LoginTabLabel,
                    children: <LoginForm onComplete={onComplete}/>,
                },
                {
                    key: 'register',
                    label: RegisterTabLabel,
                    disabled: true,
                },
            ]}
        />
    )
}
import { Form, Row, Col } from 'antd'
import get from 'lodash/get'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { Tabs, Input, Button } from '@open-condo/ui'

import styles from './AuthForm.module.css'

import { useAuth } from '@/lib/auth'

const FUL_SPAN_COL = 24

const LoginForm: React.FC = () => {
    const intl = useIntl()
    const SignInButtonLabel = intl.formatMessage({ id: 'global.action.signIn' })
    const PhoneLabel = intl.formatMessage({ id: 'global.authForm.labels.phone' })
    const PasswordLabel = intl.formatMessage({ id: 'global.authForm.labels.password' })

    const { signIn } = useAuth()

    const onSubmit = useCallback((values) => {
        const phone = get(values, 'phone')
        const password = get(values, 'password')
        signIn(phone, password)
    }, [signIn])

    return (
        <Form
            name='login'
            requiredMark={false}
            layout='vertical'
            onFinish={onSubmit}
        >
            <Row>
                <Col span={FUL_SPAN_COL}>
                    <Form.Item name='phone' label={PhoneLabel} >
                        <Input.Phone/>
                    </Form.Item>
                </Col>
                <Col span={FUL_SPAN_COL}>
                    <Form.Item name='password' label={PasswordLabel}>
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

export const AuthForm: React.FC = () => {
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
                    children: <LoginForm/>,
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
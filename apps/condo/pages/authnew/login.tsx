import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import Router from 'next/router'
import { FormattedMessage } from 'react-intl'
import React from 'react'

const INPUT_STYLE = { width: '273px' }

const LoginPage = (): React.ReactElement => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', maxWidth: '450px' }}>
                <Typography.Title style={{ textAlign: 'left' }}>{SignInTitleMsg}</Typography.Title>
                <LoginForm />
            </div>
        </div>
    )
}


const LoginForm = (): React.ReactElement  => {
    const [form] = Form.useForm()
    const initialValues = { password: '', confirm: '', captcha: 'no' }
    const intl = useIntl()
    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })     
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ResetMsg = intl.formatMessage({ id: 'pages.auth.signin.ResetPasswordLinkTitle' })
    
    const onFinish = values => {
        console.log('onFinish')
    }

    return (
        <Form
            form={form}
            name="register"
            onFinish={onFinish}
            initialValues={initialValues}
            colon={false}
            style={{ marginTop: '40px' }}
        >
            <Row gutter={[0, 24]} >
                <Col span={24}>
                    <Form.Item
                        name="phone"
                        label={PhoneMsg}
                        labelAlign='left'
                        style={{ textAlign: 'right' }}
                    >
                        <Input placeholder={ExamplePhoneMsg} style={INPUT_STYLE} />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="password"
                        label={PasswordMsg}
                        labelAlign='left'
                        style={{ textAlign: 'right' }}                        
                    >
                        <Input.Password  style={INPUT_STYLE}/>
                    </Form.Item>
                </Col>
                <Col span={12} >
                    <Form.Item style={{ textAlign: 'left', marginTop: '36px' }}>
                        <Button
                            key='submit'
                            type='sberPrimary'
                        >
                            {SignInMsg}
                        </Button>
                    </Form.Item>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                    <Typography.Text style={{ color: 'gray', marginTop: '40px' }}>
                        <FormattedMessage
                            id='pages.auth.signin.ResetPasswordLink'
                            values={{
                                link: <a style={{ color: '#44c77f' }} onClick={() => Router.push('/authnew/reset')}>{ResetMsg}</a>,
                            }}
                        ></FormattedMessage>
                    </Typography.Text>
                </Col>
            </Row>
        </Form>
    )
}


const HeaderAction = (): React.ReactElement => {
    const intl = useIntl()
    const RegisterTitle = intl.formatMessage({ id: 'pages.auth.Register' })
    return (
        <Button
            key='submit'
            onClick={() => Router.push('/authnew/register')}
            type='sberPrimary'
            secondary={true}
            style={{ fontSize: '16px', lineHeight: '24px' }}
        >
            {RegisterTitle}
        </Button>
    )
}

LoginPage.headerAction = <HeaderAction />

LoginPage.container = AuthLayout

export default LoginPage

import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row, Typography, Tooltip } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import Router from 'next/router'
import { QuestionCircleOutlined } from '@ant-design/icons'
import React from 'react'

const INPUT_STYLE = { width: '273px' }

const RegisterPage = (): React.ReactElement => {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const AllFieldsAreRequired = intl.formatMessage({ id: 'pages.auth.register.AllFieldsAreRequired' })
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', maxWidth: '512px' }}>
                <Typography.Title style={{ textAlign: 'left' }}>{RegistrationTitleMsg}</Typography.Title>
                <Typography.Paragraph style={{ textAlign: 'left', fontSize: '12px' }} >{AllFieldsAreRequired}</Typography.Paragraph>
                <RegisterForm />
            </div>
        </div>
    )
}


const RegisterForm = (): React.ReactElement  => {
    const [form] = Form.useForm()
    const initialValues = { password: '', confirm: '', captcha: 'no' }
    const intl = useIntl()
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
     
    const ExampleNameMsg = intl.formatMessage({ id: 'example.Name' })
    const WhatDoYouWantOthersToCallYouMsg = intl.formatMessage({ id: 'pages.auth.WhatDoYouWantOthersToCallYou' })
    const NameMsg = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.Password' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.ConfirmPassword' })
    const EmailMsg = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })

    
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
                        name="name"
                        label={
                            <span>
                                {NameMsg}{' '}
                                <Tooltip title={WhatDoYouWantOthersToCallYouMsg}>
                                    <QuestionCircleOutlined />
                                </Tooltip>
                            </span>
                        }
                        labelAlign='left'
                        style={{ textAlign: 'right' }}                        
                    >
                        <Input placeholder={ExampleNameMsg} style={INPUT_STYLE} />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="email"
                        label={EmailMsg}
                        labelAlign='left'
                        style={{ textAlign: 'right' }}                                 
                    >
                        <Input placeholder={'name@example.org'}  style={INPUT_STYLE}/>
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
                <Col span={24}>
                    <Form.Item
                        name="confirm"
                        label={ConfirmPasswordMsg}
                        labelAlign='left'
                        style={{ textAlign: 'right' }}                        
                    >
                        <Input.Password  style={INPUT_STYLE}/>
                    </Form.Item>
                </Col>
                <Col span={24} >
                    <Form.Item style={{ textAlign: 'left', marginTop: '36px' }}>
                        <Button
                            key='submit'
                            onClick={() => Router.push('/auth/login')}
                            type='sberPrimary'
                        >
                            {RegisterMsg}
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    )
}


const HeaderAction = (): React.ReactElement => {
    const intl = useIntl()
    const AllreadyRegisteredTitle = intl.formatMessage({ id: 'pages.auth.AlreadyRegistered' })
    return (
        <Button
            key='submit'
            onClick={() => Router.push('/authnew/login')}
            type='sberPrimary'
            secondary={true}
            style={{ fontSize: '16px', lineHeight: '24px' }}
        >
            {AllreadyRegisteredTitle}
        </Button>
    )
}

RegisterPage.headerAction = <HeaderAction />

RegisterPage.container = AuthLayout

export default RegisterPage

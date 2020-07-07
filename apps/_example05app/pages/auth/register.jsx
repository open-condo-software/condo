/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Button, Checkbox, Col, Form, Input, notification, Row, Tooltip, Typography } from 'antd'
import { useState } from 'react'
import { useMutation } from '@core/next/apollo'
import Head from 'next/head'
import { QuestionCircleOutlined } from '@ant-design/icons'
import gql from 'graphql-tag'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

import BaseLayout from '../../containers/BaseLayout'
import { getQueryParams } from '../../utils/url.utils'
import { runMutation } from '../../utils/mutations.utils'

const { Title } = Typography

const REGISTER_NEW_USER_MUTATION = gql`
    mutation registerNewUser($name: String!, $email: String!, $password: String!, $captcha: String!) {
        user: registerNewUser(name: $name, email: $email, password: $password, captcha: $captcha) {
            id
            name
            isAdmin
        }
    }
`

const layout = {
    // labelCol: {
    //     xs: { span: 24 },
    //     sm: { span: 10 },
    // },
    // wrapperCol: {
    //     xs: { span: 24 },
    //     sm: { span: 18 },
    // },
}
const tailLayout = {
    wrapperCol: {
        // xs: {
        //     span: 24,
        //     offset: 0,
        // },
        // sm: {
        //     span: 16,
        //     offset: 8,
        // },
    },
}

const RegisterForm = () => {
    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = useState(false)
    const { signin } = useAuth()
    const [register, ctx] = useMutation(REGISTER_NEW_USER_MUTATION)
    let initialValues = getQueryParams()
    initialValues = { ...initialValues, password: '', confirm: '', captcha: 'no' }

    const intl = useIntl()
    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const EmailMsg = intl.formatMessage({ id: 'Email' })
    const NameMsg = intl.formatMessage({ id: 'Name' })
    const PasswordMsg = intl.formatMessage({ id: 'Password' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'ConfirmPassword' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const CaptchaMsg = intl.formatMessage({ id: 'Captcha' })
    const RegisteredMsg = intl.formatMessage({ id: 'pages.auth.Registered' })
    const EmailIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsAlreadyRegistered' })
    const WhatDoYouWantOthersToCallYouMsg = intl.formatMessage({ id: 'pages.auth.WhatDoYouWantOthersToCallYou' })
    const PleaseInputYourNameMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourName' })
    const PleaseInputYourEmailMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourEmail' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const EmailIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const ShouldAcceptAgreementMsg = intl.formatMessage({ id: 'pages.auth.ShouldAcceptAgreement' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch', defaultMessage: "The two passwords that you entered do not match!" })
    const WeMustMakeSureThatYouAreHumanMsg = intl.formatMessage({ id: 'pages.auth.WeMustMakeSureThatYouAreHuman', defaultMessage: "We must make sure that your are a human" })
    const IHaveReadAndAcceptTheAgreementMsg = intl.formatMessage({ id: 'pages.auth.IHaveReadAndAcceptTheAgreement', defaultMessage: "I have read and accept the agreement" })
    const ErrorToFormFieldMsgMapping = {
        '[register:email:multipleFound]': {
            name: 'email',
            errors: [EmailIsAlreadyRegisteredMsg],
        },
    }

    const onFinish = values => {
        if (values.email) values.email = values.email.toLowerCase()
        setIsLoading(true)
        return runMutation({
            mutation: register,
            variables: values,
            onCompleted: () => {
                signin({ variables: form.getFieldsValue() }).then(() => { Router.push('/') }, console.error)
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
            OnCompletedMsg: RegisteredMsg,
        })
    }

    return (
        <Form
            {...layout}
            form={form}
            name="register"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            <Form.Item
                name="name"
                label={
                    <span> {NameMsg}&nbsp; <Tooltip title={WhatDoYouWantOthersToCallYouMsg}><QuestionCircleOutlined/></Tooltip></span>
                }
                rules={[{ required: true, message: PleaseInputYourNameMsg, whitespace: true }]}
            >
                <Input/>
            </Form.Item>

            <Form.Item
                name="email"
                label={EmailMsg}
                rules={[
                    {
                        type: 'email',
                        message: EmailIsNotValidMsg,
                    },
                    {
                        required: true,
                        message: PleaseInputYourEmailMsg,
                    },
                ]}
            >
                <Input/>
            </Form.Item>

            <Form.Item
                name="password"
                label={PasswordMsg}
                rules={[
                    {
                        required: true,
                        message: PleaseInputYourPasswordMsg,
                    },
                    {
                        min: 7,
                        message: PasswordIsTooShortMsg,
                    },
                ]}
                hasFeedback
            >
                <Input.Password/>
            </Form.Item>

            <Form.Item
                name="confirm"
                label={ConfirmPasswordMsg}
                dependencies={['password']}
                hasFeedback
                rules={[
                    {
                        required: true,
                        message: PleaseConfirmYourPasswordMsg,
                    },
                    ({ getFieldValue }) => ({
                        validator (rule, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve()
                            }
                            return Promise.reject(TwoPasswordDontMatchMsg)
                        },
                    }),
                ]}
            >
                <Input.Password/>
            </Form.Item>

            <Form.Item label={CaptchaMsg} extra={WeMustMakeSureThatYouAreHumanMsg} style={{ display: 'none' }}>
                <Row gutter={8}>
                    <Col span={12}>
                        <Form.Item
                            name="captcha"
                        >
                            <Input value="0571"/>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Button>???</Button>
                    </Col>
                </Row>
            </Form.Item>

            <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                    { validator: (_, value) => value ? Promise.resolve() : Promise.reject(ShouldAcceptAgreementMsg) },
                ]}
                {...tailLayout}
            >
                <Checkbox>
                    {/* TODO(pahaz): agreement link! */}
                    {IHaveReadAndAcceptTheAgreementMsg}<a href="">*</a>.
                </Checkbox>
            </Form.Item>
            <Form.Item {...tailLayout} style={{textAlign: "center"}}>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    {RegisterMsg}
                </Button>
                <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/signin')}>
                    {SignInMsg}
                </Button>
            </Form.Item>
        </Form>
    )
}

const RegisterPage = () => {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    return (<>
        <Head>
            <title>{RegistrationTitleMsg}</title>
        </Head>
        <Title css={css`text-align: center;`}>{RegistrationTitleMsg}</Title>
        <RegisterForm/>
    </>)
}

function CustomContainer (props) {
    return (<BaseLayout
        {...props}
        logoLocation="topMenu"
        className="top-menu-only-layout"
    />)
}

RegisterPage.container = CustomContainer

export default RegisterPage

/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Form, Input, Button, Typography, notification } from 'antd'
import {
    Tooltip,
    Row,
    Col,
    Checkbox,
} from 'antd'
import { useState } from 'react'
import { useMutation } from '@core/next/apollo'
import Head from 'next/head'
import { QuestionCircleOutlined } from '@ant-design/icons'
import gql from 'graphql-tag'

import Router from 'next/router'
import { BaseLayout } from '../../common/containers'
import { useAuth } from '@core/next/auth'
import { useIntl } from 'react-intl'

const { Title } = Typography

const REGISTER_NEW_USER_MUTATION = gql`
    mutation registerNewUser($data: RegisterNewUserInput!) {
        user: registerNewUser(data: $data) {
            id
            name
            isAdmin
        }
    }
`

const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 10 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 18 },
    },
}
const tailFormItemLayout = {
    wrapperCol: {
        xs: {
            span: 24,
            offset: 0,
        },
        sm: {
            span: 16,
            offset: 8,
        },
    },
}

const RegisterForm = () => {
    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = useState(false)
    const { signin } = useAuth()
    const [register, ctx] = useMutation(REGISTER_NEW_USER_MUTATION)

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

    const onFinish = values => {
        const { name, email, password } = values
        setIsLoading(true)
        register({ variables: { data: { name, email, password } } })
            .then(
                () => {
                    notification.success({ message: { RegisteredMsg } })
                    // TODO(pahaz): push to nextUrl!
                    signin({ variables: form.getFieldsValue() }).then(() => { Router.push('/') }, console.error)
                },
                (e) => {
                    const errors = []
                    console.error(e)
                    notification.error({
                        message: ServerErrorMsg,
                        description: e.message,
                    })
                    if (e.message.includes('[register:email:multipleFound]')) {
                        errors.push({
                            name: 'email',
                            errors: [EmailIsAlreadyRegisteredMsg],
                        })
                    }
                    if (errors.length) {
                        form.setFields(errors)
                    }
                })
            .finally(() => {
                setIsLoading(false)
            })
    }

    return (
        <Form
            {...formItemLayout}
            form={form}
            name="register"
            onFinish={onFinish}
            initialValues={{ captcha: 'todo' }}
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

            <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                    { validator: (_, value) => value ? Promise.resolve() : Promise.reject(ShouldAcceptAgreementMsg) },
                ]}
                {...tailFormItemLayout}
            >
                <Checkbox>
                    {/* TODO(pahaz): agreement link! */}
                    {IHaveReadAndAcceptTheAgreementMsg}<a href="">*</a>.
                </Checkbox>
            </Form.Item>
            <Form.Item {...tailFormItemLayout}>
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
        logo="topMenu"
        sideMenuStyle={{ display: 'none' }}
        mainContentWrapperStyle={{ maxWidth: '600px', minWidth: '490px', paddingTop: '50px', margin: '0 auto' }}
        mainContentBreadcrumbStyle={{ display: 'none' }}
    />)
}

RegisterPage.container = CustomContainer

export default RegisterPage

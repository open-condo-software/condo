/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Button, Checkbox, Form, Input, Tooltip, Typography } from 'antd'
import { useState } from 'react'
import { useMutation } from '@core/next/apollo'
import Head from 'next/head'
import { QuestionCircleOutlined } from '@ant-design/icons'
import gql from 'graphql-tag'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

import { TopMenuOnlyLayout } from '../../containers/BaseLayout'
import { getQueryParams } from '../../utils/url.utils'
import { runMutation } from '../../utils/mutations.utils'

const REGISTER_NEW_USER_MUTATION = gql`
    mutation registerNewUser($data: RegisterNewUserInput!) {
        user: registerNewUser(data: $data) {
            id
            name
            isAdmin
        }
    }
`

const RegisterForm = ({ children, ExtraErrorToFormFieldMsgMapping = {} }) => {
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
    const ExampleNameMsg = intl.formatMessage({ id: 'example.Name' })
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
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const WeMustMakeSureThatYouAreHumanMsg = intl.formatMessage({ id: 'pages.auth.WeMustMakeSureThatYouAreHuman' })
    const IHaveReadAndAcceptTheAgreementMsg = intl.formatMessage({ id: 'pages.auth.IHaveReadAndAcceptTheAgreement' })
    const ErrorToFormFieldMsgMapping = {
        '[register:password:minLength]': {
            name: 'password',
            errors: [PasswordIsTooShortMsg],
        },
        '[register:email:multipleFound]': {
            name: 'email',
            errors: [EmailIsAlreadyRegisteredMsg],
        },
        ...ExtraErrorToFormFieldMsgMapping,
    }

    const onFinish = values => {
        if (values.email) values.email = values.email.toLowerCase()
        const { name, email, password, confirm, agreement, ...extra } = values
        const extraData = Object.fromEntries(Object.entries(extra).filter(([k, v]) => !k.startsWith('_')))
        const data = { name, email, password, ...extraData }
        console.log(values, data)
        setIsLoading(true)
        return runMutation({
            mutation: register,
            variables: { data: data },
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
            form={form}
            name="register"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            {children}
            <Form.Item
                name="name"
                label={
                    <span>
                        {NameMsg}{' '}
                        <Tooltip title={WhatDoYouWantOthersToCallYouMsg}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </span>
                }
                rules={[{ required: true, message: PleaseInputYourNameMsg, whitespace: true }]}
            >
                <Input placeholder={ExampleNameMsg}/>
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
                <Input placeholder={'name@example.org'}/>
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
            >
                <Checkbox>
                    {/* TODO(pahaz): agreement link! */}
                    {IHaveReadAndAcceptTheAgreementMsg}<a href="">*</a>.
                </Checkbox>
            </Form.Item>
            <Form.Item style={{ textAlign: 'center' }}>
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
        <Typography.Title css={css`text-align: center;`}>{RegistrationTitleMsg}</Typography.Title>
        <RegisterForm/>
    </>)
}

RegisterPage.container = TopMenuOnlyLayout
export default RegisterPage
export {
    RegisterForm,
}

/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Button, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'

import { TopMenuOnlyLayout } from '../../containers/BaseLayout'
import { getQueryParams } from '../../utils/url.utils'
import { runMutation } from '../../utils/mutations.utils'

const SignInForm = () => {
    const [form] = Form.useForm()
    const intl = useIntl()
    const [isLoading, setIsLoading] = useState(false)
    const { signin } = useAuth()
    let initialValues = getQueryParams()
    initialValues = { ...initialValues, password: '', confirm: '', captcha: 'no' }

    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const EmailMsg = intl.formatMessage({ id: 'Email' })
    const PasswordMsg = intl.formatMessage({ id: 'Password' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const LoggedInMsg = intl.formatMessage({ id: 'pages.auth.LoggedIn' })
    const EmailIsNoFoundMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNoFound' })
    const WrongPasswordMsg = intl.formatMessage({ id: 'pages.auth.WrongPassword' })
    const PleaseInputYourEmailMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourEmail' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const ForgotPasswordMsg = intl.formatMessage({ id: 'pages.auth.ForgotPassword' })
    const ErrorToFormFieldMsgMapping = {
        '[passwordAuth:identity:notFound]': {
            name: 'email',
            errors: [EmailIsNoFoundMsg],
        },
        '[passwordAuth:secret:mismatch]': {
            name: 'password',
            errors: [WrongPasswordMsg],
        },
    }

    const onFinish = values => {
        if (values.email) values.email = values.email.toLowerCase()
        setIsLoading(true)
        return runMutation({
            mutation: signin,
            variables: values,
            onCompleted: () => {
                if (initialValues.next) Router.push(initialValues.next)
                else Router.push('/')
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
            OnCompletedMsg: LoggedInMsg,
        })
    }

    return (
        <Form
            form={form}
            name="signin"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            <Form.Item
                label={EmailMsg}
                name="email"
                rules={[{ required: true, message: PleaseInputYourEmailMsg }]}
                placeholder="name@example.com"
            >
                <Input/>
            </Form.Item>

            <Form.Item
                label={PasswordMsg}
                name="password"
                rules={[{ required: true, message: PleaseInputYourPasswordMsg }]}
                style={{ margin: '0' }}
            >
                <Input.Password/>
            </Form.Item>
            <Form.Item style={{ textAlign: 'right' }}>
                <a onClick={() => Router.push('/auth/forgot')}>{ForgotPasswordMsg}</a>
            </Form.Item>

            <Form.Item style={{ textAlign: 'center' }}>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    {SignInMsg}
                </Button>
                <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/register')}>
                    {RegisterMsg}
                </Button>
            </Form.Item>
        </Form>
    )
}

const SignInPage = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })
    return (<>
        <Head>
            <title>{SignInTitleMsg}</title>
        </Head>
        <Typography.Title css={css`text-align: center;`}>{SignInTitleMsg}</Typography.Title>
        <SignInForm/>
    </>)
}

SignInPage.container = TopMenuOnlyLayout
export default SignInPage

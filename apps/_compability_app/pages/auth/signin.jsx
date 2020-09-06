/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Form, Input, Button, Typography, notification } from 'antd'
import { useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'

import { BaseLayout } from '../../common/containers'
import { useAuth } from '@core/next/auth'
import { useIntl } from 'react-intl'

const { Title } = Typography

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
}

const SignInForm = () => {
    const [form] = Form.useForm()
    const intl = useIntl()
    const [isLoading, setIsLoading] = useState(false)
    const { signin } = useAuth()

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

    const onFinish = values => {
        setIsLoading(true)
        signin({ variables: values })
            .then(
                (data) => {
                    notification.success({ message: LoggedInMsg })
                    // TODO(pahaz): go to ?next url
                    Router.push('/')
                },
                (e) => {
                    console.log(e)
                    const errors = []
                    notification.error({
                        message: ServerErrorMsg,
                        description: e.message,
                    })
                    if (e.message.includes('[passwordAuth:identity:notFound]')) {
                        errors.push({
                            name: 'email',
                            errors: [EmailIsNoFoundMsg],
                        })
                    }
                    if (e.message.includes('[passwordAuth:secret:mismatch]')) {
                        errors.push({
                            name: 'password',
                            errors: [WrongPasswordMsg],
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
            {...layout}
            form={form}
            name="signin"
            onFinish={onFinish}
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
                css={css`margin: 0;`}
            >
                <Input.Password/>
            </Form.Item>
            <Form.Item {...tailLayout}>
                <a onClick={() => Router.push('/auth/forgot')} css={css`float: right;`}>{ForgotPasswordMsg}</a>
            </Form.Item>

            <Form.Item {...tailLayout}>
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
        <Title css={css`text-align: center;`}>{SignInTitleMsg}</Title>
        <SignInForm/>
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

SignInPage.container = CustomContainer

export default SignInPage

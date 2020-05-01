/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Form, Input, Button, Typography, notification } from 'antd'
import { useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'

import BaseLayout from '../../containers/BaseLayout'
import { useAuth } from '../../lib/auth'

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
    const [isLoading, setIsLoading] = useState(false)
    const { signin } = useAuth()

    const onFinish = values => {
        setIsLoading(true)
        signin({ variables: values })
            .then(
                (data) => {
                    notification.success({
                        message: 'logged in!',
                    })
                },
                (e) => {
                    console.log(e)
                    const errors = []
                    notification.error({
                        message: 'SignIn server error',
                        description: e.message,
                    })
                    if (e.message.includes('[passwordAuth:identity:notFound]')) {
                        errors.push({
                            name: 'email',
                            errors: [('This email is not found')],
                        })
                    }
                    if (e.message.includes('[passwordAuth:secret:mismatch]')) {
                        errors.push({
                            name: 'password',
                            errors: [('Wrong password')],
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
                label="Email"
                name="email"
                rules={[{ required: true, message: 'Please input your email!' }]}
                placeholder="name@example.com"
            >
                <Input/>
            </Form.Item>

            <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please input your password!' }]}
                css={css`margin: 0;`}
            >
                <Input.Password/>
            </Form.Item>
            <Form.Item {...tailLayout}>
                <a onClick={() => Router.push('/auth/forgot')} css={css`float: right;`}>
                    Forgot password
                </a>
            </Form.Item>

            <Form.Item {...tailLayout}>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    Sign in
                </Button>
                <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/register')}>
                    Register
                </Button>
            </Form.Item>
        </Form>
    )
}

const SignInPage = () => {
    return (<>
        <Head>
            <title>Register</title>
        </Head>
        <Title css={css`text-align: center;`}>Register</Title>
        <SignInForm/>
    </>)
}

function CustomContainer (props) {
    return (<BaseLayout
        {...props}
        sideMenuStyle={{ display: 'none' }}
        mainContentWrapperStyle={{ maxWidth: '600px', paddingTop: '50px' }}
        mainContentBreadcrumbStyle={{ display: 'none' }}
    />)
}

SignInPage.container = CustomContainer

export default SignInPage

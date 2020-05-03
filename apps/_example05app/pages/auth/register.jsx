/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Form, Input, Button, Typography, notification } from 'antd'
import {
    Tooltip,
    Cascader,
    Select,
    Row,
    Col,
    Checkbox,
    AutoComplete,
} from 'antd'
import { useState } from 'react'
import { useMutation } from '@apollo/react-hooks'
import Head from 'next/head'
import { QuestionCircleOutlined } from '@ant-design/icons'
import gql from 'graphql-tag'

import Router from 'next/router'
import BaseLayout from '../../containers/BaseLayout'
import { useAuth } from '../../lib/auth'

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

    const onFinish = values => {
        console.log('Received values of form: ', values)
        setIsLoading(true)
        register({ variables: values })
            .then(
                () => {
                    notification.success({
                        message: 'registered!',
                    })
                    // TODO(pahaz): push to nextUrl!
                    signin({ variables: form.getFieldsValue() }).then(() => { Router.push('/') }, console.error)
                },
                (e) => {
                    const errors = []
                    console.error(e)
                    notification.error({
                        message: 'Register server error',
                        description: e.message,
                    })
                    if (e.message.includes('[register:email:multipleFound]')) {
                        errors.push({
                            name: 'email',
                            errors: [('This email is already registered')],
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
            initialValues={{ captcha: '12312' }}
        >
            <Form.Item
                name="name"
                label={
                    <span> Name&nbsp; <Tooltip
                        title="What do you want others to call you?"><QuestionCircleOutlined/></Tooltip></span>
                }
                rules={[{ required: true, message: 'Please input your real!', whitespace: true }]}
            >
                <Input/>
            </Form.Item>

            <Form.Item
                name="email"
                label="E-mail"
                rules={[
                    {
                        type: 'email',
                        message: 'The input is not valid E-mail!',
                    },
                    {
                        required: true,
                        message: 'Please input your E-mail!',
                    },
                ]}
            >
                <Input/>
            </Form.Item>

            <Form.Item
                name="password"
                label="Password"
                rules={[
                    {
                        required: true,
                        message: 'Please input your password!',
                    },
                    {
                        min: 7,
                        message: 'Your should be more then 6 character',
                    },
                ]}
                hasFeedback
            >
                <Input.Password/>
            </Form.Item>

            <Form.Item
                name="confirm"
                label="Confirm Password"
                dependencies={['password']}
                hasFeedback
                rules={[
                    {
                        required: true,
                        message: 'Please confirm your password!',
                    },
                    ({ getFieldValue }) => ({
                        validator (rule, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve()
                            }
                            return Promise.reject('The two passwords that you entered do not match!')
                        },
                    }),
                ]}
            >
                <Input.Password/>
            </Form.Item>

            <Form.Item label="Captcha" extra="We must make sure that your are a human." style={{ display: 'none' }}>
                <Row gutter={8}>
                    <Col span={12}>
                        <Form.Item
                            name="captcha"
                        >
                            <Input value="0571"/>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Button>Get captcha</Button>
                    </Col>
                </Row>
            </Form.Item>

            <Form.Item
                name="agreement"
                valuePropName="checked"
                rules={[
                    { validator: (_, value) => value ? Promise.resolve() : Promise.reject('Should accept agreement') },
                ]}
                {...tailFormItemLayout}
            >
                <Checkbox>
                    I have read and accept the <a href="">agreement</a>
                </Checkbox>
            </Form.Item>
            <Form.Item {...tailFormItemLayout}>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    Register
                </Button>
                <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/signin')}>
                    Sign in
                </Button>
            </Form.Item>
        </Form>
    )
}

const RegisterPage = () => {
    return (<>
        <Head>
            <title>Register</title>
        </Head>
        <Title css={css`text-align: center;`}>Register</Title>
        <RegisterForm/>
    </>)
}

function CustomContainer (props) {
    return (<BaseLayout
        {...props}
        logo="topMenu"
        sideMenuStyle={{ display: 'none' }}
        mainContentWrapperStyle={{ maxWidth: '600px', paddingTop: '50px', margin: '0 auto' }}
        mainContentBreadcrumbStyle={{ display: 'none' }}
    />)
}

RegisterPage.container = CustomContainer

export default RegisterPage

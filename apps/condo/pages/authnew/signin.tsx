import { useIntl } from '@core/next/intl'
import { Form, Input, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import Router from 'next/router'
import { FormattedMessage } from 'react-intl'
import React from 'react'
import Head from 'next/head'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import MaskedInput from 'antd-mask-input'


const INPUT_STYLE = { minWidth: '273px' }
const LINK_STYLE = { color: '#389E0D' }
const SMALL_TEXT = { fontSize: '12px', lineHeight: '20px', color: 'gray' }

const LoginPage = (): React.ReactElement => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })
    return (
        <>
            <Head>
                <title>{SignInTitleMsg}</title>
            </Head>
            <div>
                <Typography.Title>{SignInTitleMsg}</Typography.Title>
                <LoginForm />
            </div>
        </>
    )
}


const LoginForm = (): React.ReactElement => {
    const [form] = Form.useForm()
    let initialValues = getQueryParams()
    initialValues = { ...initialValues, password: '', confirm: '', captcha: 'no' }
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
            style={{ marginTop: '36px', width: '450px' }}
        >
            <Form.Item
                name="phone"
                label={PhoneMsg}
                labelAlign='left'
                labelCol={{ flex: 1 }}
            >
                <MaskedInput mask='+7 (111) 111-11-11' placeholder={ExamplePhoneMsg} style={{ ...INPUT_STYLE }} />
            </Form.Item>

            <Form.Item
                name="password"
                label={PasswordMsg}
                labelAlign='left'
                labelCol={{ flex: 1 }} 
                style={{ marginTop: '24px' }}
            >
                <Input.Password style={{ ...INPUT_STYLE }}  />
            </Form.Item>
            
            <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    key='submit'
                    type='sberPrimary'
                    style={{ justifySelf: 'flex-start' }}
                >
                    {SignInMsg}
                </Button>

                <Typography.Text  style={SMALL_TEXT}>
                    <FormattedMessage
                        id='pages.auth.signin.ResetPasswordLink'
                        values={{
                            link: <a style={LINK_STYLE} onClick={() => Router.push('/authnew/reset')}>{ResetMsg}</a>,
                        }}
                    ></FormattedMessage>
                </Typography.Text>
            </div>
            

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

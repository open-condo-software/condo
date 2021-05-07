import { useIntl } from '@core/next/intl'
import { Form, Input, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import MaskedInput from 'antd-mask-input'
import { gql } from 'graphql-tag'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import Router from 'next/router'
import { FormattedMessage } from 'react-intl'
import React, { useState } from 'react'
import Head from 'next/head'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { useAuth } from '@core/next/auth'



const SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION = gql`
    mutation authenticateUserWithPhoneAndPassword ($phone: String!, $password: String!) {
        obj: authenticateUserWithPhoneAndPassword(data: { phone: $phone, password: $password }) {
            item {
                id
            }
        }
    }
` 

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
    const { next } = getQueryParams()
    const { refetch } = useAuth()
    const initialValues = { password: '', phone: '' }
    const intl = useIntl()
    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ResetMsg = intl.formatMessage({ id: 'pages.auth.signin.ResetPasswordLinkTitle' })
    const UserNotFound = intl.formatMessage({ id: 'pages.auth.UserIsNotFound' })
    const PasswordMismatch = intl.formatMessage({ id: 'pages.auth.WrongPassword' }) 

    const [isLoading, setIsLoading] = useState(false)
    const [signinByPhoneAndPassword] = useMutation(SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION)
    const ErrorToFormFieldMsgMapping = {
        '[notfound.error]': {
            name: 'phone',
            errors: [UserNotFound],
        },
        '[passwordAuth:secret:mismatch]': {
            name: 'password',
            errors: [PasswordMismatch],
        },
    }
    
    const onFinish = values => {
        setIsLoading(true)
        return runMutation({
            mutation: signinByPhoneAndPassword,
            variables: values,
            onCompleted: () => {
                refetch()
                Router.push(next ? next : '/')
                console.log('COMPLETE ! LOGIN ')
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            console.log('Mutation error: ', error)
            setIsLoading(false)
        })
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
                    htmlType="submit" 
                    style={{ justifySelf: 'flex-start' }}
                    loading={isLoading}
                >
                    {SignInMsg}
                </Button>

                <Typography.Text  style={SMALL_TEXT}>
                    <FormattedMessage
                        id='pages.auth.signin.ResetPasswordLink'
                        values={{
                            link: <a style={LINK_STYLE} onClick={() => Router.push('/auth/forgot')}>{ResetMsg}</a>,
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
            onClick={() => Router.push('/auth/register')}
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

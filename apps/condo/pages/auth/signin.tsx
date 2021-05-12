import AuthLayout, { AuthLayoutContext, AuthPage } from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import React, { useState, useContext } from 'react'
import Router from 'next/router'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { useAuth } from '@core/next/auth'
import { Form, Input, Typography } from 'antd'
import Head from 'next/head'
import { Button } from '@condo/domains/common/components/Button'
import MaskedInput from 'antd-mask-input'
import { colors } from '@condo/domains/common/constants/style'
import { useIntl } from '@core/next/intl'
import { FormattedMessage } from 'react-intl'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { SIGNIN_BY_PHONE_AND_PASSWORD_MUTATION } from '@condo/domains/user/gql'
import { WRONG_PHONE_ERROR, WRONG_PASSWORD_ERROR } from '@condo/domains/user/constants/errors'

const LINK_STYLE = { color: colors.sberPrimary[7] }
const INPUT_STYLE = { minWidth: '20em' }

const SignInPage: AuthPage = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })
    return (
        <>
            <Head>
                <title>{SignInTitleMsg}</title>
            </Head>
            <div>
                <Typography.Title>{SignInTitleMsg}</Typography.Title>
                <SignInForm />
            </div>
        </>
    )
}

// Todo(zuch): responsive HTML
const SignInForm = (): React.ReactElement => {
    const [form] = Form.useForm()
    const { next } = getQueryParams()
    const { refetch } = useAuth()
    const initialValues = { password: '', phone: '' }
    const intl = useIntl()
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
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
        [WRONG_PHONE_ERROR]: {
            name: 'phone',
            errors: [UserNotFound],
        },        
        [WRONG_PASSWORD_ERROR]: {
            name: 'password',
            errors: [PasswordMismatch],
        },
    }
    
    const onFormSubmit = values => {
        setIsLoading(true)
        return runMutation({
            mutation: signinByPhoneAndPassword,
            variables: values,
            onCompleted: () => {
                refetch()
                Router.push(next ? next : '/')
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            setIsLoading(false)
        })
    }

    return (
        <div>
            <Form
                form={form}
                name="signin"
                onFinish={onFormSubmit}
                initialValues={initialValues}
                colon={false}
                style={{ marginTop: '36px', width: '450px' }}
            >
                <Form.Item
                    name="phone"
                    label={PhoneMsg}
                    labelAlign='left'
                    labelCol={{ flex: 1 }}
                    rules={[{ required: true, message: FieldIsRequiredMsg }]}
                >
                    <MaskedInput mask='+1 (111) 111-11-11' placeholder={ExamplePhoneMsg} style={{ ...INPUT_STYLE }} />
                </Form.Item>

                <Form.Item
                    name="password"
                    label={PasswordMsg}
                    labelAlign='left'
                    labelCol={{ flex: 1 }} 
                    style={{ marginTop: '24px' }}
                    rules={[{ required: true, message: FieldIsRequiredMsg }]}
                >
                    <Input.Password style={{ ...INPUT_STYLE }}  />
                </Form.Item>
                
                <div style={{ paddingTop: '60px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Button
                        key='submit'
                        type='sberPrimary'
                        htmlType="submit" 
                        style={{ justifySelf: 'flex-start' }}
                        loading={isLoading}
                    >
                        {SignInMsg}
                    </Button>

                    <Typography.Text  type='secondary'>
                        <FormattedMessage
                            id='pages.auth.signin.ResetPasswordLink'
                            values={{
                                link: <a style={LINK_STYLE} onClick={() => Router.push('/auth/forgot')}>{ResetMsg}</a>,
                            }}
                        />
                    </Typography.Text>
                </div>
            </Form>
        </div>
    )
}

const HeaderAction: React.FunctionComponent = () => {
    const intl = useIntl()
    const RegisterTitle = intl.formatMessage({ id: 'pages.auth.Register' })
    const { isMobile } = useContext(AuthLayoutContext)
    return (
        <Button
            key='submit'
            onClick={() => Router.push('/auth/register')}
            type='sberPrimary'
            secondary={true}
            size={isMobile ? 'middle' : 'large'}
        >
            {RegisterTitle}
        </Button>
    )
}

SignInPage.headerAction = <HeaderAction />

SignInPage.container = AuthLayout

export default SignInPage

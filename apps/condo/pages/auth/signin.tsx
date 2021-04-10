// @ts-nocheck
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Button, Form, Input, Typography, Row, Col } from 'antd'
import { useState } from 'react'
import gql from 'graphql-tag'
import Head from 'next/head'
import Router from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useMutation } from '@core/next/apollo'

import { TopMenuOnlyLayout } from '@condo/domains/common/components/containers/BaseLayout'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { WRONG_EMAIL_ERROR, WRONG_PASSWORD_ERROR } from '@condo/domains/common/constants/errors'

import { AuthState, PhoneAuthForm } from './register'

const SIGNIN_BY_FIREBASE_ID_TOKEN_MUTATION = gql`
    mutation authenticateUserWithFirebaseIdToken ($token: String!) {
        obj: authenticateUserWithFirebaseIdToken(data: { firebaseIdToken: $token }) {
            item {
                id
            }
        }
    }
`

const SignInForm = ({ firebaseUser, children, ExtraErrorToFormFieldMsgMapping = {} }) => {
    const [form] = Form.useForm()
    const intl = useIntl()
    const [isLoading, setIsLoading] = useState(false)
    const { refetch } = useAuth()
    const [signin, ctx] = useMutation(SIGNIN_BY_FIREBASE_ID_TOKEN_MUTATION)
    let initialValues = getQueryParams()
    initialValues = { ...initialValues, password: '', confirm: '', captcha: 'no' }

    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const PasswordMsg = intl.formatMessage({ id: 'Password' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const LoggedInMsg = intl.formatMessage({ id: 'pages.auth.LoggedIn' })
    const EmailIsNoFoundMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNoFound' })
    const WrongPasswordMsg = intl.formatMessage({ id: 'pages.auth.WrongPassword' })
    const UserIsNotFoundMsg = intl.formatMessage({ id: 'pages.auth.UserIsNotFound' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const ForgotPasswordMsg = intl.formatMessage({ id: 'pages.auth.ForgotPassword' })
    const ErrorToFormFieldMsgMapping = {
        [WRONG_EMAIL_ERROR]: {
            name: 'email',
            errors: [EmailIsNoFoundMsg],
        },
        [WRONG_PASSWORD_ERROR]: {
            name: 'password',
            errors: [WrongPasswordMsg],
        },
        '[notfound.error]': {
            name: 'user',
            errors: [UserIsNotFoundMsg],
        },
        ...ExtraErrorToFormFieldMsgMapping,
    }

    const onFinish = values => {
        setIsLoading(true)
        return runMutation({
            mutation: signin,
            variables: {
                token: firebaseUser.token,
            },
            onCompleted: () => {
                refetch()
                if (initialValues.next) Router.push(initialValues.next)
                else Router.push('/')
            },
            onFinally: () => {
                setIsLoading(false)
            },
            onError: (e) => {
                console.error(e.friendlyDescription)
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
            {children}
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

function SignInByPhoneForm () {
    const intl = useIntl()
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const PhoneIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsAlreadyRegistered' })
    const PhoneMsg = intl.formatMessage({ id: 'Phone' })
    const ExtraErrorToFormFieldMsgMapping = {
        '[unique:importId:multipleFound]': {
            name: '_phone',
            errors: [PhoneIsAlreadyRegisteredMsg],
        },
        '[unique:phone:multipleFound]': {
            name: '_phone',
            errors: [PhoneIsAlreadyRegisteredMsg],
        },
    }

    return <PhoneAuthForm onPhoneAuthenticated={({ user }) => {
        return <SignInForm ExtraErrorToFormFieldMsgMapping={ExtraErrorToFormFieldMsgMapping} firebaseUser={user}>
            <Row gutter={[0, 24]} >
                <Col span={24}>
                    <Form.Item
                        name="_phone"
                        label={
                            <span>
                                {PhoneMsg}{' '}
                            </span>
                        }
                        rules={[{ required: true, message: FieldIsRequiredMsg }]}
                        key={user.phoneNumber}
                        initialValue={user.phoneNumber}
                    >
                        <Input disabled={true} />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="firebaseIdToken"
                        noStyle={true}
                        key={user.token}
                        initialValue={user.token}
                    >
                        <Input disabled={true} hidden={true} />
                    </Form.Item>
                </Col>
            </Row>
        </SignInForm>
    }} />
}

const SignInPage = () => {
    const intl = useIntl()
    const SignInTitleMsg = intl.formatMessage({ id: 'pages.auth.SignInTitle' })
    return (<>
        <Head>
            <title>{SignInTitleMsg}</title>
        </Head>
        <Typography.Title css={css`text-align: center;`}>{SignInTitleMsg}</Typography.Title>
        <AuthState>
            <SignInByPhoneForm />
        </AuthState>
    </>)
}

SignInPage.container = TopMenuOnlyLayout
export default SignInPage

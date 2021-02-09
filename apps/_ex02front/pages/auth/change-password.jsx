/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { useState } from 'react'
import { Button, Form, Input, Result, Typography } from 'antd'
import Head from 'next/head'
import Router from 'next/router'
import { useIntl } from '@core/next/intl'
import { useMutation } from '@core/next/apollo'
import gql from 'graphql-tag'

import { TopMenuOnlyLayout } from '../../containers/BaseLayout'
import { getQueryParams } from '../../utils/url.utils'
import { runMutation } from '../../utils/mutations.utils'

const CHANGE_PASSWORD_WITH_TOKEN_MUTATION = gql`
    mutation changePasswordWithToken($token: String!, $password: String!) {
        status: changePasswordWithToken(token: $token, password: $password)
    }
`

const ChangePasswordForm = () => {
    const [form] = Form.useForm()
    const intl = useIntl()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccessMessage, setIsSuccessMessage] = useState(false)
    const [changePassword, ctx] = useMutation(CHANGE_PASSWORD_WITH_TOKEN_MUTATION)
    let initialValues = getQueryParams()
    initialValues = { ...initialValues, password: '', confirm: '' }

    const PasswordMsg = intl.formatMessage({ id: 'Password' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'ConfirmPassword' })
    const ChangeMsg = intl.formatMessage({ id: 'Change' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const ChangedMsg = intl.formatMessage({ id: 'Changed' })
    const GoToLoginMsg = intl.formatMessage({ id: 'GoToLogin' })
    const PasswordWasChangedMsg = intl.formatMessage({ id: 'pages.auth.PasswordWasChanged' })
    const PasswordWasChangedDescriptionMsg = intl.formatMessage({ id: 'pages.auth.PasswordWasChangedDescription' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const ErrorToFormFieldMsgMapping = {}  // TODO(pahaz): password is the same error?!

    const onFinish = values => {
        setIsLoading(true)
        return runMutation({
            mutation: changePassword,
            variables: values,
            onCompleted: () => setIsSuccessMessage(true),
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        })
    }

    if (isSuccessMessage) {
        return <Result
            status="success"
            title={PasswordWasChangedMsg}
            subTitle={PasswordWasChangedDescriptionMsg}
            extra={[
                <Button onClick={() => Router.push('/auth/signin')}>{GoToLoginMsg}</Button>,
            ]}
        />
    }

    return (
        <Form
            form={form}
            name="change-password"
            onFinish={onFinish}
            initialValues={initialValues}
        >

            <Form.Item name="token" style={{ display: 'none' }}>
                <Input type="hidden"/>
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


            <Form.Item style={{ textAlign: 'center' }}>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    {ChangeMsg}
                </Button>
            </Form.Item>
        </Form>
    )
}

const ChangePasswordPage = () => {
    const intl = useIntl()
    const ChangePasswordTitleMsg = intl.formatMessage({ id: 'pages.auth.ChangePasswordTitle' })
    return (<>
        <Head>
            <title>{ChangePasswordTitleMsg}</title>
        </Head>
        <Typography.Title css={css`text-align: center;`} level={2}>{ChangePasswordTitleMsg}</Typography.Title>
        <ChangePasswordForm/>
    </>)
}

ChangePasswordPage.container = TopMenuOnlyLayout
export default ChangePasswordPage

import { jsx } from '@emotion/core'
import Router from 'next/router'

import { useIntl } from '@core/next/intl'
import { Form, Input, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import React, { useState } from 'react'

import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { gql } from 'graphql-tag'



const INPUT_STYLE = { width: '273px' }

const CHANGE_PASSWORD_WITH_TOKEN_MUTATION = gql`
    mutation changePasswordWithToken($token: String!, $password: String!) {
        status: changePasswordWithToken(token: $token, password: $password)
    }
`

const ChangePasswordPage = (): React.ReactElement => {
    const [form] = Form.useForm()
    const queryParams = getQueryParams()
    const initialValues = { ...queryParams, password: 'zeliboba', confirm: 'zeliboba' }
    const [isLoading, setIsLoading] = useState(false)
    const [changePassword] = useMutation(CHANGE_PASSWORD_WITH_TOKEN_MUTATION)

    const intl = useIntl()
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const CreateNewPassword = intl.formatMessage({ id: 'pages.auth.reset.CreateNewPasswordMsg' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.ConfirmPassword' })
    const AndSignInMsg = intl.formatMessage({ id: 'pages.auth.reset.AndSignInMsg' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const ErrorToFormFieldMsgMapping = {
    }


    
    const onFinish = values => {
        setIsLoading(true)
        return runMutation({
            mutation: changePassword,
            variables: values,
            onCompleted: () => {
                console.log('COMPLETE ! LOGIN ')
            },
            onFinally: () => {
                setIsLoading(false)
                Router.push('/auth/signin')
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
        <div style={{ maxWidth: '450px' }}>
            <Typography.Title style={{ textAlign: 'left' }}>{ResetTitle}</Typography.Title>
            <Typography.Paragraph style={{ textAlign: 'left' }} >{CreateNewPassword}</Typography.Paragraph>
                
            <Form
                form={form}
                name="change-password"
                onFinish={onFinish}
                initialValues={initialValues}
                colon={false}
                style={{ marginTop: '40px' }}
            >
                <Form.Item name="token" style={{ display: 'none' }}>
                    <Input type="hidden" />
                </Form.Item>
                <Form.Item
                    name="password"
                    label={PasswordMsg}
                    labelAlign='left'
                    labelCol={{ flex: 1 }}                            
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
                >
                    <Input.Password style={INPUT_STYLE}/>
                </Form.Item>
                <Form.Item
                    name="confirm"
                    label={ConfirmPasswordMsg}
                    labelAlign='left'
                    labelCol={{ flex: 1 }}                            
                    style={{ marginTop: '40px' }}                        
                    dependencies={['password']}
                    rules={[
                        {
                            required: true,
                            message: PleaseConfirmYourPasswordMsg,
                        },
                        ({ getFieldValue }) => ({
                            validator (_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve()
                                }
                                return Promise.reject(TwoPasswordDontMatchMsg)
                            },
                        }),
                    ]}                            
                >
                    <Input.Password  style={INPUT_STYLE}/>
                </Form.Item>
                <Form.Item style={{ textAlign: 'left', marginTop: '36px' }}>
                    <Button
                        key='submit'
                        type='sberPrimary'
                        loading={isLoading}
                        htmlType="submit" 
                    >
                        {SaveMsg}
                    </Button>
                    <Typography.Text style={{ color: 'gray', marginLeft: '20px', marginTop: '40px', fontSize: '12px' }}>
                        {AndSignInMsg}
                    </Typography.Text>
                </Form.Item>
            </Form>
        </div>
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

ChangePasswordPage.headerAction = <HeaderAction />

ChangePasswordPage.container = AuthLayout

export default ChangePasswordPage

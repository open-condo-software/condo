import Router from 'next/router'

import { useIntl } from '@core/next/intl'
import { Form, Input, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout, { AuthLayoutContext, AuthPage } from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import React, { useState, useContext } from 'react'
import { MIN_PASSWORD_LENGTH } from '@condo/domains/user/constants/common'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { CHANGE_PASSWORD_WITH_TOKEN_MUTATION } from '@condo/domains/user/gql'

const INPUT_STYLE = { width: '20em' }

const ChangePasswordPage: AuthPage = () => {
    const [form] = Form.useForm()
    const { token } = getQueryParams()
    const initialValues = { token, password: '', confirm: '' }
    const [isLoading, setIsLoading] = useState(false)
    const [changePassword] = useMutation(CHANGE_PASSWORD_WITH_TOKEN_MUTATION)

    const intl = useIntl()
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const CreateNewPasswordMsg = intl.formatMessage({ id: 'pages.auth.reset.CreateNewPasswordMsg' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.ConfirmPassword' })
    const AndSignInMsg = intl.formatMessage({ id: 'pages.auth.reset.AndSignInMsg' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const ErrorToFormFieldMsgMapping = {}

    const onFinish = values => {
        setIsLoading(true)
        return runMutation({
            mutation: changePassword,
            variables: values,
            onFinally: () => {
                setIsLoading(false)
                Router.push('/auth/signin')
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        }).catch(error => {
            setIsLoading(false)
        })
    }

    return (
        <div >
            <Typography.Title style={{ textAlign: 'left' }}>{ResetTitle}</Typography.Title>
            <Typography.Paragraph style={{ textAlign: 'left' }} >{CreateNewPasswordMsg}</Typography.Paragraph>
                
            <Form
                form={form}
                name="change-password"
                onFinish={onFinish}
                initialValues={initialValues}
                colon={false}
                style={{ marginTop: '40px' }}
                requiredMark={false}                
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
                            min: MIN_PASSWORD_LENGTH,
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
                <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'flex-start' }}>
                    <Form.Item >
                        <Button
                            key='submit'
                            type='sberPrimary'
                            loading={isLoading}
                            htmlType="submit" 
                        >
                            {SaveMsg}
                        </Button>
                        <Typography.Text type='secondary' style={{ marginLeft: '20px' }}>
                            {AndSignInMsg}
                        </Typography.Text>
                    </Form.Item>
                </div>
            </Form>
        </div>
    )
}


const HeaderAction = (): React.ReactElement => {
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

ChangePasswordPage.headerAction = <HeaderAction />

ChangePasswordPage.container = AuthLayout

export default ChangePasswordPage

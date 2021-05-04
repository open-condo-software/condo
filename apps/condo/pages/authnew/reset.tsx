import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import Router from 'next/router'
import React, { useState } from 'react'

import { getQueryParams } from '@condo/domains/common/utils/url.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { useMutation } from '@core/next/apollo'
import { gql } from 'graphql-tag'

const START_PASSWORD_RECOVERY_MUTATION = gql`
    mutation startPasswordRecovery($email: String!){
        status: startPasswordRecovery(email: $email)
    }
`


const INPUT_STYLE = { width: '273px' }
const LINK_STYLE = { color: '#389E0D' }

const ResetPage = (): React.ReactElement => {
    const [resetState, setResetState] = useState('inputEmail')

    return (
        <div style={{ maxWidth: '455px' }}>
            {   
                {
                    inputEmail: <ResetForm onFinish={() => setResetState('checkEmail')} />,
                    checkEmail: <CheckEmailInfo onFinish={() => setResetState('changePassword')} />,
                    changePassword: <ChangePasswordForm onFinish={() => setResetState('inputEmail')}/>,
                }[resetState] || null
            }
        </div>
    )
}

interface IResetFormProps {
    onFinish: () => void
}

const ResetForm = ({ onFinish }): React.ReactElement<IResetFormProps>  => {
    const [form] = Form.useForm()
    const initialValues = { ...getQueryParams(), password: '', confirm: '', email: 'dkoviazin@gmail.com' }
    const intl = useIntl()
    const RestorePasswordMsg = intl.formatMessage({ id: 'pages.auth.reset.RestorePasswordTitle' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const EmailMsg = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    const InstructionsMsg = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp' })
    const EmailIsNotRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotRegistered' })
    const PleaseInputYourEmailMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourEmail' })

    const [isLoading, setIsLoading] = useState(false)
    const [isSuccessMessage, setIsSuccessMessage] = useState(false)
    const [startPasswordRecovery] = useMutation(START_PASSWORD_RECOVERY_MUTATION)
    const ErrorToFormFieldMsgMapping = {
        '[unknown-user]': {
            name: 'email',
            errors: [EmailIsNotRegisteredMsg],
        },
    }
    if (isLoading) {
        return <LoadingOrErrorPage title={ResetTitle} loading={isLoading} error={null}/>
    }


    if (isSuccessMessage) {
        onFinish()
        return
    }
    const onSubmit = values => {
        if (values.email) values.email = values.email.toLowerCase()
        setIsLoading(true)
        console.log('Run mutation')
        return runMutation({
            mutation: startPasswordRecovery,
            variables: values,
            onCompleted: () => setIsSuccessMessage(true),
            onFinally: () => {
                console.log('Run mutation - done!')
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
        })
    }

    return (
        <>
            <Typography.Title style={{ textAlign: 'left' }}>{ResetTitle}</Typography.Title>
            <Typography.Paragraph style={{ textAlign: 'left' }}>{InstructionsMsg}</Typography.Paragraph>    
            <Form
                form={form}
                name="register"
                onFinish={onSubmit}
                initialValues={initialValues}
                colon={false}
                style={{ marginTop: '40px' }}
            >
                <Form.Item
                    name="email"
                    label={EmailMsg}
                    rules={[{ required: true, message: PleaseInputYourEmailMsg }]}
                    labelAlign='left'
                    labelCol={{ flex: 1 }}                            
                >
                    <Input placeholder={'name@example.org'}  style={INPUT_STYLE}/>
                </Form.Item>
                <Form.Item style={{ textAlign: 'left', marginTop: '36px' }}>
                    <Button
                        key='submit'
                        type='sberPrimary'
                        htmlType="submit" 
                        loading={isLoading}
                        style={{ marginTop: '24px' }}
                    >
                        {RestorePasswordMsg}
                    </Button>
                </Form.Item>
            </Form>
        </>
    )
}

interface ICheckEmailInfoProps {
    onFinish: () => void
}

const CheckEmailInfo = ({ onFinish }): React.ReactElement<ICheckEmailInfoProps>  => {
    const intl = useIntl()
    const CheckEmailMsg = intl.formatMessage({ id: 'pages.auth.reset.CheckEmail' })
    const InstructionsMsg = intl.formatMessage({ id: 'pages.auth.reset.ResetHelp' })
    const ReturnToLoginPage = intl.formatMessage({ id: 'pages.auth.reset.ReturnToLoginPage' })
    return (
        <>
            <Typography.Title style={{ textAlign: 'left' }}>{CheckEmailMsg}</Typography.Title>
            <Typography.Paragraph style={{ textAlign: 'left' }}>{InstructionsMsg}</Typography.Paragraph>    
            <Typography.Paragraph style={{ textAlign: 'left' }}>
                <a style={LINK_STYLE} onClick={onFinish}>{ReturnToLoginPage}</a>
            </Typography.Paragraph>    
        </>
    )
}

interface IChangePasswordFormProps {
    onFinish: () => void
}

const ChangePasswordForm = ({ onFinish }): React.ReactElement<IChangePasswordFormProps> => {
    const [form] = Form.useForm()
    const initialValues = { password: '', confirm: '', captcha: 'no' }
    const intl = useIntl()
    const SaveMsg = intl.formatMessage({ id: 'Save' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.signin.field.Password' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const CreateNewPassword = intl.formatMessage({ id: 'pages.auth.reset.CreateNewPasswordMsg' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.ConfirmPassword' })
    const AndSignInMsg = intl.formatMessage({ id: 'pages.auth.reset.AndSignInMsg' })
    
    return (
        <>
            <Typography.Title style={{ textAlign: 'left' }}>{ResetTitle}</Typography.Title>

            <Typography.Paragraph style={{ textAlign: 'left' }} >{CreateNewPassword}</Typography.Paragraph>
                
            <Form
                form={form}
                name="register"
                onFinish={onFinish}
                initialValues={initialValues}
                colon={false}
                style={{ marginTop: '40px' }}
            >
                <Row gutter={[0, 24]} >
                    <Col span={24}>
                        <Form.Item
                            name="password"
                            label={PasswordMsg}
                            labelAlign='left'
                            style={{ textAlign: 'right' }}                        
                        >
                            <Input.Password  style={INPUT_STYLE}/>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name="confirm"
                            label={ConfirmPasswordMsg}
                            labelAlign='left'
                            style={{ textAlign: 'right' }}                        
                        >
                            <Input.Password  style={INPUT_STYLE}/>
                        </Form.Item>
                    </Col>
                    <Col span={24} >
                        <Form.Item style={{ textAlign: 'left', marginTop: '36px' }}>
                            <Button
                                key='submit'
                                onClick={onFinish}
                                type='sberPrimary'
                            >
                                {SaveMsg}
                            </Button>
                            <Typography.Text style={{ color: 'gray', marginLeft: '20px', marginTop: '40px' }}>
                                {AndSignInMsg}
                            </Typography.Text>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </>
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

ResetPage.headerAction = <HeaderAction />

ResetPage.container = AuthLayout

export default ResetPage

import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row, Typography } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import Router from 'next/router'
import React, { useEffect, useState } from 'react'

const INPUT_STYLE = { width: '273px' }

const ResetPage = (): React.ReactElement => {
    const [resetState, setResetState] = useState('input')

    useEffect(() => {
        console.log('State is ', resetState)
    }, [resetState])
    
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', maxWidth: '400px' }}>
                {   
                    {
                        input: <ResetForm onFinish={() => setResetState('checkemail')}/>,
                        checkemail: <CheckEmailInfo onFinish={() => setResetState('changepassword')} />,
                        changepassword: <ChangePasswordForm onFinish={() => setResetState('input')}/>,
                    }[resetState] || null
                }
            </div>
        </div>
    )
}

interface IResetFormProps {
    onFinish: () => void
}

const ResetForm = ({ onFinish }): React.ReactElement<IResetFormProps>  => {
    const [form] = Form.useForm()
    const initialValues = { password: '', confirm: '', captcha: 'no' }
    const intl = useIntl()
    const RestorePasswordMsg = intl.formatMessage({ id: 'pages.auth.reset.RestorePasswordTitle' })
    const ResetTitle = intl.formatMessage({ id: 'pages.auth.ResetTitle' })
    const EmailMsg = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    return (
        <>
            <Typography.Title style={{ textAlign: 'left' }}>{ResetTitle}</Typography.Title>
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
                            name="email"
                            label={EmailMsg}
                            labelAlign='left'
                            style={{ textAlign: 'right' }}                                 
                        >
                            <Input placeholder={'name@example.org'}  style={INPUT_STYLE}/>
                        </Form.Item>
                    </Col>
                    <Col span={24} >
                        <Form.Item style={{ textAlign: 'left', marginTop: '36px' }}>
                            <Button
                                key='submit'
                                type='sberPrimary'
                                onClick={onFinish}
                            >
                                {RestorePasswordMsg}
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
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
                <a style={{ color: '#44c77f' }} onClick={onFinish}>{ReturnToLoginPage}</a>
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

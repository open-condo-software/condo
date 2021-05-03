import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Row, Typography, Tooltip } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import AuthLayout from '@condo/domains/common/components/containers/BaseLayout/AuthLayout'
import Router from 'next/router'
import { QuestionCircleOutlined } from '@ant-design/icons'
import React, { useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { formatPhone } from '@condo/domains/common/utils/helpers'
import MaskedInput from 'antd-mask-input'

const INPUT_STYLE = { width: '273px' }
const POLICY_LOCATION = '/policy.pdf'
const TEST_PHONE = '+79226052265'
const LINK_STYLE = { color: '#389E0D' }

const RegisterPage = (): React.ReactElement => {
    const intl = useIntl()
    const [registerState, setRegisterState] = useState('phoneInput')
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-block', maxWidth: '512px' }}>
                <Typography.Title style={{ textAlign: 'left' }}>{RegistrationTitleMsg}</Typography.Title>
                {   
                    {
                        phoneInput: <InputPhoneForm onFinish={() => setRegisterState('phoneCheck')}  />,
                        phoneCheck: <ValidatePhoneForm onFinish={() => setRegisterState('register')} changeState={(state) => setRegisterState(state)} />,
                        register: <RegisterForm onFinish={() => setRegisterState('phoneInput')} />,
                    }[registerState] || null
                }
            </div>
        </div>
    )
}


interface IInputPhoneFormProps {
    onFinish: () => void
}

const InputPhoneForm = ({ onFinish }): React.ReactElement<IInputPhoneFormProps>  => {
    const [form] = Form.useForm()
    const initialValues = { password: '', confirm: '', captcha: 'no' }
    const intl = useIntl()
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const RegisterHelpMessage = intl.formatMessage({ id: 'pages.auth.reset.RegisterHelp' })
    const UserAgreementFileName = intl.formatMessage({ id: 'pages.auth.register.info.UserAgreementFileName' })
    
    
    const RegisterMsg = intl.formatMessage({ id: 'Register' })    
    return (
        <>
            <Typography.Paragraph style={{ textAlign: 'left', fontSize: '16px' }}>{RegisterHelpMessage}</Typography.Paragraph>    
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
                            name="phone"
                            label={PhoneMsg}
                            labelAlign='left'
                            style={{ textAlign: 'right' }}
                        >
                            <MaskedInput mask='+7 (111) 111-11-11' placeholder={ExamplePhoneMsg} style={{ ...INPUT_STYLE }} />
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Typography.Paragraph style={{ textAlign: 'left', fontSize: '12px', marginTop: '12px', lineHeight: '20px' }}>
                        
                            <FormattedMessage
                                id='pages.auth.register.info.UserAgreement'
                                values={{
                                    link: <a style={LINK_STYLE} target='_blank' href={POLICY_LOCATION} rel="noreferrer">{UserAgreementFileName}</a>,
                                }}
                            ></FormattedMessage>
                            
                        </Typography.Paragraph>    
                    </Col>
                    <Col span={24} >
                        <Form.Item style={{ textAlign: 'left', marginTop: '24px' }}>
                            <Button
                                key='submit'
                                type='sberPrimary'
                                onClick={onFinish}
                            >
                                {RegisterMsg}
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
            
        </>
    )
}


interface IValidatePhoneFormProps {
    onFinish: () => void
    changeState: (state: string) => void
}

const ValidatePhoneForm = ({ onFinish, changeState }): React.ReactElement<IValidatePhoneFormProps>  => {
    const [form] = Form.useForm()
    const initialValues = { password: '', confirm: '', captcha: 'no' }
    const intl = useIntl()
    const ChangePhoneNumberLabel = intl.formatMessage({ id: 'pages.auth.register.ChangePhoneNumber' })    
    const SmsCodeTitle = intl.formatMessage({ id: 'pages.auth.register.field.SmsCode' })
    const [phone, setPhone] = useState(formatPhone(TEST_PHONE))
    const [isPhoneVisible, setisPhoneVisible] = useState(false)
    const PhoneToggleLabel = isPhoneVisible ? intl.formatMessage({ id: 'Hide' }) : intl.formatMessage({ id: 'Show' })
    useEffect(() => {
        if (isPhoneVisible) {
            setPhone(formatPhone(TEST_PHONE))
        } else {
            const unHidden = formatPhone(TEST_PHONE)
            setPhone(`${unHidden.substring(0, 9)}***${unHidden.substring(12)}`)
        }        
    }, [isPhoneVisible])
    return (
        <>
            <Typography.Paragraph style={{ textAlign: 'left' }}>
                <FormattedMessage
                    id='pages.auth.register.info.SmsCodeSent'
                    values={{
                        phone: <span>{phone} <a style={LINK_STYLE} onClick={() => setisPhoneVisible(!isPhoneVisible)}>({PhoneToggleLabel})</a></span>,
                    }}
                ></FormattedMessage>
            </Typography.Paragraph>    
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
                            name="smscode"
                            label={SmsCodeTitle}
                            labelAlign='left'
                            style={{ textAlign: 'right' }}                                 
                        >
                            <Input  style={INPUT_STYLE}/>
                        </Form.Item>
                    </Col>
                    <Col span={24} >
                        <Typography.Paragraph style={{ textAlign: 'left', marginTop: '32px' }}>
                            <a style={{ ...LINK_STYLE, fontSize: '12px', lineHeight: '20px' }} onClick={() => changeState('register')}>{ChangePhoneNumberLabel}</a>
                        </Typography.Paragraph>
                    </Col>
                </Row>
            </Form>
        </>
    )
}

interface IRegisterFormProps {
    onFinish: () => void
}

const RegisterForm = ({ onFinish }): React.ReactElement<IRegisterFormProps>  => {
    const [form] = Form.useForm()
    const initialValues = { password: '', confirm: '', captcha: 'no' }
    const intl = useIntl()
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const PhoneMsg = intl.formatMessage({ id: 'pages.auth.register.field.Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
     
    const ExampleNameMsg = intl.formatMessage({ id: 'example.Name' })
    const WhatDoYouWantOthersToCallYouMsg = intl.formatMessage({ id: 'pages.auth.WhatDoYouWantOthersToCallYou' })
    const NameMsg = intl.formatMessage({ id: 'pages.auth.register.field.Name' })
    const PasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.Password' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'pages.auth.register.field.ConfirmPassword' })
    const EmailMsg = intl.formatMessage({ id: 'pages.auth.register.field.Email' })
    
    const AllFieldsAreRequired = intl.formatMessage({ id: 'pages.auth.register.AllFieldsAreRequired' })

    return (
        <>
            <Typography.Paragraph style={{ textAlign: 'left', fontSize: '12px' }} >{AllFieldsAreRequired}</Typography.Paragraph>
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
                            name="phone"
                            label={PhoneMsg}
                            labelAlign='left'
                            style={{ textAlign: 'right' }}
                        >
                            <MaskedInput mask='+7 (111) 111-11-11' placeholder={ExamplePhoneMsg} style={{ ...INPUT_STYLE }} />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            name="name"
                            label={
                                <span>
                                    {NameMsg}{' '}
                                    <Tooltip title={WhatDoYouWantOthersToCallYouMsg}>
                                        <QuestionCircleOutlined />
                                    </Tooltip>
                                </span>
                            }
                            labelAlign='left'
                            style={{ textAlign: 'right' }}                        
                        >
                            <Input placeholder={ExampleNameMsg} style={INPUT_STYLE} />
                        </Form.Item>
                    </Col>
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
                                {RegisterMsg}
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </>
    )
}


const HeaderAction = (): React.ReactElement => {
    const intl = useIntl()
    const AllreadyRegisteredTitle = intl.formatMessage({ id: 'pages.auth.AlreadyRegistered' })
    return (
        <Button
            key='submit'
            onClick={() => Router.push('/authnew/signin')}
            type='sberPrimary'
            secondary={true}
            style={{ fontSize: '16px', lineHeight: '24px' }}
        >
            {AllreadyRegisteredTitle}
        </Button>
    )
}

RegisterPage.headerAction = <HeaderAction />

RegisterPage.container = AuthLayout

export default RegisterPage

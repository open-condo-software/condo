// @ts-nocheck
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { QuestionCircleOutlined } from '@ant-design/icons'

import { TopMenuOnlyLayout } from '@condo/domains/common/components/containers/BaseLayout'
import { EMAIL_ALREADY_REGISTERED_ERROR, MIN_PASSWORD_LENGTH_ERROR } from '@condo/domains/common/constants/errors'
import {
    AUTH as firebaseAuth,
    initRecaptcha,
    IS_FIREBASE_CONFIG_VALID, resetRecaptcha,
} from '@condo/domains/common/utils/firebase.front.utils'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getQueryParams } from '@condo/domains/common/utils/url.utils'

import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { REGISTER_NEW_USER_MUTATION } from '@condo/domains/user/gql'
import { useMutation } from '@core/next/apollo'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { Alert, Button, Checkbox, Col, Form, Input, Row, Tooltip, Typography } from 'antd'
import Head from 'next/head'
import Router from 'next/router'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AuthContext = createContext({})

const Auth = ({ children, initialUser }) => {
    const [user, setUser] = useState(initialUser || null)

    useEffect(() => {
        return firebaseAuth().onAuthStateChanged(async function (user) {
            if (user) {
                user.token = await user.getIdToken(true)
            }

            setUser(user)
        })
    }, [])

    async function sendCode (phoneNumber, recaptchaVerifier) {
        return await firebaseAuth().signInWithPhoneNumber(phoneNumber, recaptchaVerifier).then((res) => {
            console.log('res from send conde', res)

            return res
        })
    }

    async function verifyCode (confirmationResult, verificationCode) {
        return await confirmationResult.confirm(verificationCode).then(res => {
            console.log('res from verify code', res)

            return res
        })
    }

    async function signout () {
        return await firebaseAuth().signOut()
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: Boolean(user),
                user,
                sendCode,
                verifyCode,
                signout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

const RegisterForm = ({ children, register, registerExtraData = {}, ExtraErrorToFormFieldMsgMapping = {} }) => {
    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = useState(false)
    const { signin } = useAuth()

    let initialValues = getQueryParams()
    initialValues = { ...initialValues, password: '', confirm: '', captcha: 'no' }

    const intl = useIntl()
    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const RegisterMsg = intl.formatMessage({ id: 'Register' })
    const EmailMsg = intl.formatMessage({ id: 'Email' })
    const NameMsg = intl.formatMessage({ id: 'Name' })
    const ExampleNameMsg = intl.formatMessage({ id: 'example.Name' })
    const PasswordMsg = intl.formatMessage({ id: 'Password' })
    const ConfirmPasswordMsg = intl.formatMessage({ id: 'ConfirmPassword' })
    const RegisteredMsg = intl.formatMessage({ id: 'pages.auth.Registered' })
    const EmailIsAlreadyRegisteredMsg = intl.formatMessage({ id: 'pages.auth.EmailIsAlreadyRegistered' })
    const WhatDoYouWantOthersToCallYouMsg = intl.formatMessage({ id: 'pages.auth.WhatDoYouWantOthersToCallYou' })
    const PleaseInputYourNameMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourName' })
    const PleaseInputYourEmailMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourEmail' })
    const PleaseInputYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseInputYourPassword' })
    const PleaseConfirmYourPasswordMsg = intl.formatMessage({ id: 'pages.auth.PleaseConfirmYourPassword' })
    const EmailIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const PasswordIsTooShortMsg = intl.formatMessage({ id: 'pages.auth.PasswordIsTooShort' })
    const ShouldAcceptAgreementMsg = intl.formatMessage({ id: 'pages.auth.ShouldAcceptAgreement' })
    const TwoPasswordDontMatchMsg = intl.formatMessage({ id: 'pages.auth.TwoPasswordDontMatch' })
    const IHaveReadAndAcceptTheAgreementMsg = intl.formatMessage({ id: 'pages.auth.IHaveReadAndAcceptTheAgreement' })
    const ErrorToFormFieldMsgMapping = {
        [MIN_PASSWORD_LENGTH_ERROR]: {
            name: 'password',
            errors: [PasswordIsTooShortMsg],
        },
        [EMAIL_ALREADY_REGISTERED_ERROR]: {
            name: 'email',
            errors: [EmailIsAlreadyRegisteredMsg],
        },
        ...ExtraErrorToFormFieldMsgMapping,
    }

    const onFinish = values => {
        if (values.email) values.email = values.email.toLowerCase()
        const { name, email, password, confirm, agreement, ...extra } = values
        const extraData = Object.fromEntries(Object.entries(extra).filter(([k, v]) => !k.startsWith('_')))
        const data = { name, email, password, ...extraData, ...registerExtraData }
        setIsLoading(true)
        return runMutation({
            mutation: register,
            variables: { data: data },
            onCompleted: () => {
                signin({ variables: form.getFieldsValue() }).then(() => { Router.push('/') }, console.error)
            },
            onFinally: () => {
                setIsLoading(false)
            },
            intl,
            form,
            ErrorToFormFieldMsgMapping,
            OnCompletedMsg: RegisteredMsg,
        })
    }

    return (
        <Form
            form={form}
            name="register"
            onFinish={onFinish}
            initialValues={initialValues}
        >
            <Row gutter={[0, 24]} >
                <Col span={24}>
                    {children}
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
                        rules={[{ required: true, message: PleaseInputYourNameMsg, whitespace: true }]}
                    >
                        <Input placeholder={ExampleNameMsg} />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="email"
                        label={EmailMsg}
                        rules={[
                            {
                                type: 'email',
                                message: EmailIsNotValidMsg,
                            },
                            {
                                required: true,
                                message: PleaseInputYourEmailMsg,
                            },
                        ]}
                    >
                        <Input placeholder={'name@example.org'} />
                    </Form.Item>
                </Col>
                <Col span={24}>
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
                        <Input.Password />
                    </Form.Item>
                </Col>
                <Col span={24}>
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
                        <Input.Password />
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="agreement"
                        valuePropName="checked"
                        rules={[
                            { validator: (_, value) => value ? Promise.resolve() : Promise.reject(ShouldAcceptAgreementMsg) },
                        ]}
                    >
                        <Checkbox>
                            {/* TODO(pahaz): agreement link! */}
                            {IHaveReadAndAcceptTheAgreementMsg}<a href="">*</a>.
                        </Checkbox>
                    </Form.Item>
                </Col>
                <Col span={24}>
                    <Form.Item style={{ textAlign: 'center' }}>
                        <Button type="primary" htmlType="submit" loading={isLoading}>
                            {RegisterMsg}
                        </Button>
                        <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/signin')}>
                            {SignInMsg}
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    )
}

function PhoneAuthForm ({ onPhoneAuthenticated }) {
    // TODO(pahaz): how-to change phone!? If you want to register new user?!?!
    const { user, sendCode, verifyCode } = useContext(AuthContext)
    const recaptchaVerifier = useRef(null)
    const verificationCodeTextInput = useRef(null)
    const [, setCaptcha] = useState('')
    const [confirmationResult, setConfirmationResult] = useState('')
    const [verifyError, setVerifyError] = useState('')
    const [, setVerifyInProgress] = useState(false)
    const [, setVerificationCode] = useState('')
    const [confirmError, setConfirmError] = useState('')
    const [, setConfirmInProgress] = useState(false)
    const [form] = Form.useForm()

    const intl = useIntl()
    const SignInMsg = intl.formatMessage({ id: 'SignIn' })
    const ClientSideErrorMsg = intl.formatMessage({ id: 'ClientSideError' })
    const EnterPhoneNumberMsg = intl.formatMessage({ id: 'EnterPhoneNumber' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const SendVerificationCodeMsg = intl.formatMessage({ id: 'SendVerificationCode' })
    const ResendVerificationCodeMsg = intl.formatMessage({ id: 'ResendVerificationCode' })
    const EnterVerificationCodeMsg = intl.formatMessage({ id: 'EnterVerificationCode' })
    const ConfirmVerificationCodeMsg = intl.formatMessage({ id: 'ConfirmVerificationCode' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })

    useEffect(() => {
        recaptchaVerifier.current = initRecaptcha(setCaptcha, setCaptcha)

        if (typeof window !== 'undefined') {
            window.recaptchaVerifier = recaptchaVerifier.current
        }

        return () => {
            recaptchaVerifier.current.clear()
        }
    }, [])

    async function handleSendCode () {
        const { phone } = await form.validateFields(['phone'])

        try {
            setVerifyError('')
            setVerifyInProgress(true)
            setConfirmationResult('')
            const confirmationResult = await sendCode(phone, recaptchaVerifier.current)
            setVerifyInProgress(false)
            setConfirmationResult(confirmationResult)
            verificationCodeTextInput.current?.focus()
        } catch (err) {
            setVerifyError(String(err))
            setVerifyInProgress(false)

            resetRecaptcha()
            // (Dimitreee): Reset recaptcha verifier if sms didnt send
            console.log('handle recaptcha re init', err)
        }
    }

    async function handleVerifyCode () {
        const { code } = await form.validateFields(['code'])
        try {
            setConfirmError('')
            setConfirmInProgress(true)
            await verifyCode(confirmationResult, code)
            setConfirmInProgress(false)
            setConfirmationResult('')
            setVerificationCode('')
            verificationCodeTextInput.current?.clear()
            // Alert.alert('Phone authentication successful!')
        } catch (err) {
            setConfirmError(String(err))
            setConfirmInProgress(false)
        }
    }

    if (!IS_FIREBASE_CONFIG_VALID) {
        return <Typography.Title style={{ color: '#f00' }}>{ClientSideErrorMsg}</Typography.Title>
    }

    if (user) {
        return onPhoneAuthenticated({ user })
    }

    return <>
        <div id={'recaptcha-container'} />
        <Form
            form={form}
            name="auth.phone"
            // onFinish={onFinish}
        >
            <Row gutter={[0, 24]} >
                <Col span={24}>
                    {
                        (verifyError || confirmError)
                            ? <Alert
                                message="Error"
                                description={verifyError || confirmError}
                                type="error"
                                closable
                            ></Alert> : null
                    }
                </Col>
                <Col span={24}>
                    <Form.Item
                        name="phone"
                        label={EnterPhoneNumberMsg}
                        rules={[{ required: true, message: FieldIsRequiredMsg }]}
                    >
                        <Input placeholder={ExamplePhoneMsg} />
                    </Form.Item>
                </Col>
                {(confirmationResult)
                    ? <Col span={24}>
                        <Form.Item
                            name="code"
                            label={EnterVerificationCodeMsg}
                            rules={[{ required: true, message: FieldIsRequiredMsg }]}
                        >
                            <Input ref={verificationCodeTextInput} />
                        </Form.Item>
                    </Col>
                    : null
                }
                <Col span={24}>
                    <Form.Item style={{ textAlign: 'center' }}>
                        {(confirmationResult) ?
                            <>
                                <Button type="primary" onClick={handleVerifyCode}>
                                    {ConfirmVerificationCodeMsg}
                                </Button>
                                <Button type="link" css={css`margin-left: 10px;`} onClick={handleSendCode}>
                                    {(confirmationResult) ? ResendVerificationCodeMsg : SendVerificationCodeMsg}
                                </Button>
                            </>
                            :
                            <>
                                <Button type="primary" onClick={handleSendCode}>
                                    {(confirmationResult) ? ResendVerificationCodeMsg : SendVerificationCodeMsg}
                                </Button>
                                <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/signin')}>
                                    {SignInMsg}
                                </Button>
                            </>
                        }
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    </>
}

function RegisterByPhoneForm () {
    const [register] = useMutation(REGISTER_NEW_USER_MUTATION)
    const registerExtraData = {
        dv: 1,
        sender: getClientSideSenderInfo(),
    }

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
        return <RegisterForm register={register} registerExtraData={registerExtraData} ExtraErrorToFormFieldMsgMapping={ExtraErrorToFormFieldMsgMapping}>
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
        </RegisterForm>
    }} />
}

const RegisterPage = () => {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    return (<>
        <Head>
            <title>{RegistrationTitleMsg}</title>
        </Head>
        <Typography.Title css={css`text-align: center;`}>{RegistrationTitleMsg}</Typography.Title>
        <Auth>
            <RegisterByPhoneForm />
        </Auth>
    </>)
}

RegisterPage.container = TopMenuOnlyLayout

export default RegisterPage

export {
    Auth,
    PhoneAuthForm,
}

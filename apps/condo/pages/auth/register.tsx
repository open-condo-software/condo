// @ts-nocheck
/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Button, Checkbox, Form, Input, Tooltip, Typography } from 'antd'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import { QuestionCircleOutlined } from '@ant-design/icons'

import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { REGISTER_NEW_USER_MUTATION } from '@condo/domains/user/gql'
import { useMutation } from '@core/next/apollo'
import { useIntl } from '@core/next/intl'
import { useAuth } from '@core/next/auth'

import { TopMenuOnlyLayout } from '../../containers/BaseLayout'
import firebase, { isFirebaseConfigValid } from '../../utils/firebase.front.utils'
import { getQueryParams } from '../../utils/url.utils'
import { runMutation } from '../../utils/mutations.utils'

const AuthContext = createContext({})

function AuthState ({ children, initialUser }) {
    const [user, setUser] = useState(initialUser || null)

    useEffect(() => {
        return firebase.auth().onAuthStateChanged(async function (user) {
            console.log('onAuthStateChanged', user)
            if (user) {
                const token = await user.getIdToken(true)
                console.log('auth:', token)
                user.token = token
            }

            setUser(user)
        })
    }, [])

    async function sendCode (phoneNumber, recaptchaVerifier) {
        const phoneProvider = new firebase.auth.PhoneAuthProvider()
        const verificationId = await phoneProvider.verifyPhoneNumber(
            phoneNumber,
            // @ts-ignore
            recaptchaVerifier,
        )
        return verificationId
    }

    async function verifyCode (verificationId, verificationCode) {
        const credential = firebase.auth.PhoneAuthProvider.credential(
            verificationId,
            verificationCode,
        )
        await firebase
            .auth()
            .signInWithCredential(credential)
        // const user = await firebase
        //     .auth()
        //     .currentUser
        // // await setCurrentUser(JSON.parse(JSON.stringify(user)))
        // // const u = await getCurrentUser()
        // setUser(user)
        return true
    }

    async function signout () {
        return await firebase.auth().signOut()
        // setUser(null)
        // await setCurrentUser(null)
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: !!user,
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
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })
    const CaptchaMsg = intl.formatMessage({ id: 'Captcha' })
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
    const WeMustMakeSureThatYouAreHumanMsg = intl.formatMessage({ id: 'pages.auth.WeMustMakeSureThatYouAreHuman' })
    const IHaveReadAndAcceptTheAgreementMsg = intl.formatMessage({ id: 'pages.auth.IHaveReadAndAcceptTheAgreement' })
    const ErrorToFormFieldMsgMapping = {
        '[register:password:minLength]': {
            name: 'password',
            errors: [PasswordIsTooShortMsg],
        },
        '[register:email:multipleFound]': {
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
        console.log(values, data)
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
            {children}
            <Form.Item
                name="name"
                label={
                    <span>
                        {NameMsg}{' '}
                        <Tooltip title={WhatDoYouWantOthersToCallYouMsg}>
                            <QuestionCircleOutlined/>
                        </Tooltip>
                    </span>
                }
                rules={[{ required: true, message: PleaseInputYourNameMsg, whitespace: true }]}
            >
                <Input placeholder={ExampleNameMsg}/>
            </Form.Item>

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
                <Input placeholder={'name@example.org'}/>
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
            <Form.Item style={{ textAlign: 'center' }}>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                    {RegisterMsg}
                </Button>
                <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/signin')}>
                    {SignInMsg}
                </Button>
            </Form.Item>
        </Form>
    )
}

function PhoneAuthForm ({ onPhoneAuthenticated }) {
    // TODO(pahaz): how-to change phone!? If you want to register new user?!?!
    const { user, sendCode, verifyCode } = useContext(AuthContext)
    const recaptchaVerifier = useRef(null)
    const verificationCodeTextInput = useRef(null)
    const [captcha, setCaptcha] = useState('')
    const [verificationId, setVerificationId] = useState('')
    const [verifyError, setVerifyError] = useState('')
    const [verifyInProgress, setVerifyInProgress] = useState(false)
    const [verificationCode, setVerificationCode] = useState('')
    const [confirmError, setConfirmError] = useState('')
    const [confirmInProgress, setConfirmInProgress] = useState(false)
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
    const VerificationCodeHasBeenSentToYourPhoneMsg = intl.formatMessage({ id: 'VerificationCodeHasBeenSentToYourPhone' })
    const PhoneMsg = intl.formatMessage({ id: 'Phone' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })

    useEffect(() => {
        const recapcha = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
            'size': 'invisible',
            'callback': function (response) {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
                // ...
                setCaptcha(response)
            },
            'expired-callback': function () {
                // Response expired. Ask user to solve reCAPTCHA again.
                // ...
                setCaptcha('')
            },
        })
        recaptchaVerifier.current = recapcha
        if (typeof window !== 'undefined') window.recaptchaVerifier = recapcha
        return () => {
            recapcha.clear()
        }
    }, [])

    async function handleSendCode () {
        const { phone } = await form.validateFields(['phone'])
        try {
            setVerifyError('')
            setVerifyInProgress(true)
            setVerificationId('')
            const verificationId = await sendCode(phone, recaptchaVerifier.current)
            setVerifyInProgress(false)
            setVerificationId(verificationId)
            verificationCodeTextInput.current?.focus()
        } catch (err) {
            setVerifyError(String(err))
            setVerifyInProgress(false)
        }
    }

    async function handleVerifyCode () {
        const { code } = await form.validateFields(['code'])
        try {
            setConfirmError('')
            setConfirmInProgress(true)
            await verifyCode(verificationId, code)
            setConfirmInProgress(false)
            setVerificationId('')
            setVerificationCode('')
            verificationCodeTextInput.current?.clear()
            // Alert.alert('Phone authentication successful!')
        } catch (err) {
            setConfirmError(String(err))
            setConfirmInProgress(false)
        }
    }

    if (!isFirebaseConfigValid) {
        return <Typography.Title style={{ color: '#f00' }}>{ClientSideErrorMsg}</Typography.Title>
    }

    if (user) {
        return onPhoneAuthenticated({ user })
    }

    return <>
        <div id={'recaptcha-container'}/>
        <Form
            form={form}
            name="auth.phone"
            // onFinish={onFinish}
        >
            <div>
                {verifyError}{confirmError}
            </div>
            <Form.Item
                name="phone"
                label={EnterPhoneNumberMsg}
                rules={[{ required: true, message: FieldIsRequiredMsg }]}
            >
                <Input placeholder={ExamplePhoneMsg}/>
            </Form.Item>

            {(verificationId)
                ? <Form.Item
                    name="code"
                    label={EnterVerificationCodeMsg}
                    rules={[{ required: true, message: FieldIsRequiredMsg }]}
                >
                    <Input ref={verificationCodeTextInput}/>
                </Form.Item>
                : null
            }

            <Form.Item style={{ textAlign: 'center' }}>
                {(verificationId) ?
                    <>
                        <Button type="primary" onClick={handleVerifyCode}>
                            {ConfirmVerificationCodeMsg}
                        </Button>
                        <Button type="link" css={css`margin-left: 10px;`} onClick={handleSendCode}>
                            {(verificationId) ? ResendVerificationCodeMsg : SendVerificationCodeMsg}
                        </Button>
                    </>
                    :
                    <>
                        <Button type="primary" onClick={handleSendCode}>
                            {(verificationId) ? ResendVerificationCodeMsg : SendVerificationCodeMsg}
                        </Button>
                        <Button type="link" css={css`margin-left: 10px;`} onClick={() => Router.push('/auth/signin')}>
                            {SignInMsg}
                        </Button>
                    </>
                }
            </Form.Item>
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
                <Input disabled={true}/>
            </Form.Item>
            <Form.Item
                name="firebaseIdToken"
                noStyle={true}
                key={user.token}
                initialValue={user.token}
            >
                <Input disabled={true} hidden={true}/>
            </Form.Item>
        </RegisterForm>
    }}/>
}

const RegisterPage = () => {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    return (<>
        <Head>
            <title>{RegistrationTitleMsg}</title>
        </Head>
        <Typography.Title css={css`text-align: center;`}>{RegistrationTitleMsg}</Typography.Title>
        <AuthState>
            <RegisterByPhoneForm/>
        </AuthState>
    </>)
}

RegisterPage.container = TopMenuOnlyLayout
export default RegisterPage
export {
    AuthState,
    PhoneAuthForm,
}

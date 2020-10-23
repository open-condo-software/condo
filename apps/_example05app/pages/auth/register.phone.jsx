/** @jsx jsx */
import { css, jsx } from '@emotion/core'
import { Button, Form, Input, Typography } from 'antd'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import { useIntl } from '@core/next/intl'

import { TopMenuOnlyLayout } from '../../containers/BaseLayout'
import firebase, { isFirebaseConfigValid } from '../../utils/firebase'
import { RegisterForm } from './register'

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

            {(verificationId) ?
                <Form.Item
                    name="code"
                    label={EnterVerificationCodeMsg}
                    rules={[{ required: true, message: FieldIsRequiredMsg }]}
                >
                    <Input ref={verificationCodeTextInput}/>
                </Form.Item>
                :
                null
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
        return <RegisterForm ExtraErrorToFormFieldMsgMapping={ExtraErrorToFormFieldMsgMapping}>
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

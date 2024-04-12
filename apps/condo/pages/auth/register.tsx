import { Typography } from 'antd'
import Head from 'next/head'
import Router, { useRouter } from 'next/router'
import qs from 'qs'
import React, { useCallback, useContext, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { Button } from '@condo/domains/common/components/Button'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { fontSizes } from '@condo/domains/common/constants/style'
import { InputPhoneForm } from '@condo/domains/user/components/auth/InputPhoneForm'
import { RegisterContext, RegisterContextProvider } from '@condo/domains/user/components/auth/RegisterContextProvider'
import { RegisterForm } from '@condo/domains/user/components/auth/RegisterForm'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'


const HeaderAction = () => {
    const router = useRouter()
    return router.query.step == 'inputPhone' && (
        <WelcomeHeaderTitle/>
    )
}

const RegisterPage: AuthPage = () => {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const PhoneConfirmTokenErrorLabel = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorLabel' })
    const PhoneConfirmTokenErrorMessage = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorMessage' })
    const RestartPhoneConfirmLabel = intl.formatMessage({ id: 'pages.auth.register.RestartPhoneConfirmLabel' })
    const router = useRouter()

    const { token, isConfirmed, tokenError, setToken, setTokenError } = useContext(RegisterContext)
    const [step, setStep] = useState('inputPhone')

    const handleFinish = useCallback(async () => {
        await router.push('/')
    }, [router])

    useEffect(() => {
        if (token && isConfirmed) {
            setStep('register')
        } else if (token) {
            setStep('validatePhone')
        } else {
            setStep('inputPhone')
        }
    }, [token, isConfirmed])

    useEffect(() => {
        router.push(router.route + qs.stringify(
            { ...router.query, step },
            { arrayFormat: 'comma', skipNulls: true, addQueryPrefix: true },
        ))
    }, [step])

    if (tokenError && token) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {PhoneConfirmTokenErrorLabel}
                </Typography.Title>
                <Typography.Text style={{ fontSize: fontSizes.content }}>
                    {PhoneConfirmTokenErrorMessage}
                </Typography.Text>
                <Button
                    type='sberPrimary'
                    style={{ marginTop: '16px' }}
                    onClick={() => {
                        setToken(null)
                        setTokenError(null)
                        setStep('inputPhone')
                        Router.push('/auth/register')
                    }}
                >
                    {RestartPhoneConfirmLabel}
                </Button>
            </BasicEmptyListView>
        )
    }

    const steps = {
        inputPhone: <InputPhoneForm onFinish={() => setStep('validatePhone')}/>,
        validatePhone: <ValidatePhoneForm
            onFinish={() => setStep('register')}
            onReset={() => {
                setStep('inputPhone')
                Router.push('/auth/register')
            }}
            title={RegistrationTitleMsg}
        />,
        register: <RegisterForm onFinish={handleFinish}/>,
    }

    return (
        <>
            <Head><title>{RegistrationTitleMsg}</title></Head>
            <RegisterContextProvider>
                {steps[step]}
            </RegisterContextProvider>
        </>
    )
}

RegisterPage.headerAction = <HeaderAction/>

RegisterPage.container = AuthLayout

export default RegisterPage

import { Button } from '@condo/domains/common/components/Button'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { InputPhoneForm } from '@condo/domains/user/components/auth/InputPhoneForm'
import { RegisterContext, RegisterContextProvider } from '@condo/domains/user/components/auth/RegisterContextProvider'
import { RegisterForm } from '@condo/domains/user/components/auth/RegisterForm'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'
import { useIntl } from '@core/next/intl'
import { Typography } from 'antd'
import Router, { useRouter } from 'next/router'
import React, { useContext, useEffect, useState } from 'react'
import { useMutation } from '@core/next/apollo'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { CREATE_ONBOARDING_MUTATION } from '@condo/domains/onboarding/gql'
import { fontSizes } from '@condo/domains/common/constants/style'
import qs from 'qs'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'
import Head from 'next/head'

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

    const [createOnBoarding] = useMutation(CREATE_ONBOARDING_MUTATION, {
        onCompleted: () => {
            Router.push('/onboarding')
        },
    })

    const initOnBoarding = (userId: string) => {
        const onBoardingExtraData = {
            dv: 1,
            sender: getClientSideSenderInfo(),
        }

        const data = { ...onBoardingExtraData, type: 'ADMINISTRATOR', userId }

        return runMutation({
            mutation: createOnBoarding,
            variables: { data },
            intl,
        })
    }

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
        register: <RegisterForm onFinish={initOnBoarding}/>,
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

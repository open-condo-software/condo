import { Row, Col } from 'antd'
import { setCookie } from 'cookies-next'
import Head from 'next/head'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useMemo } from 'react'

import { useEffectOnce } from '@open-condo/miniapp-utils'
import { useIntl } from '@open-condo/next/intl'
import { Button, Typography } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { COOKIE_MAX_AGE_IN_SEC } from '@condo/domains/common/constants/cookies'
import { PageComponentType } from '@condo/domains/common/types'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { InputPhoneForm } from '@condo/domains/user/components/auth/InputPhoneForm'
import { RegisterContextProvider, useRegisterContext } from '@condo/domains/user/components/auth/RegisterContextProvider'
import { RegisterForm } from '@condo/domains/user/components/auth/RegisterForm'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import AuthLayout, { AuthLayoutProps } from '@condo/domains/user/components/containers/AuthLayout'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'
import { AUTH_FLOW_USER_TYPE_COOKIE_NAME } from '@condo/domains/user/constants/auth'
import { useAuthMethods } from '@condo/domains/user/hooks/useAuthMethods'


const RegisterPage: PageComponentType = () => {
    const intl = useIntl()
    const InputPhoneTitle = intl.formatMessage({ id: 'pages.auth.register.step.inputPhone.title' })
    const ValidatePhoneTitle = intl.formatMessage({ id: 'pages.auth.register.step.validatePhone.title' })
    const RegisterTitle = intl.formatMessage({ id: 'pages.auth.register.step.register.title' })
    const PhoneConfirmTokenErrorLabel = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorLabel' })
    const PhoneConfirmTokenErrorMessage = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorMessage' })
    const RestartPhoneConfirmLabel = intl.formatMessage({ id: 'pages.auth.register.RestartPhoneConfirmLabel' })
    const router = useRouter()
    const { query: { next } } = router
    const isValidNextUrl = next && !Array.isArray(next) && isSafeUrl(next)
    const { queryParams } = useAuthMethods()

    const { token, isConfirmed, tokenError, setToken, setTokenError } = useRegisterContext()
    const [step, setStep] = useState<'inputPhone' | 'validatePhone' | 'register'>('inputPhone')

    const title = useMemo(() => {
        if (step === 'inputPhone') return InputPhoneTitle
        if (step === 'validatePhone') return ValidatePhoneTitle
        if (step === 'register') return RegisterTitle
        return ''
    }, [InputPhoneTitle, RegisterTitle, ValidatePhoneTitle, step])

    const handleFinish = useCallback(async () => {
        if (isValidNextUrl) {
            await router.push(next)
        } else {
            await router.push('/')
        }
    }, [])

    const steps = useMemo(() => ({
        inputPhone: <InputPhoneForm
            onFinish={() => setStep('validatePhone')}
        />,
        validatePhone: <ValidatePhoneForm
            onFinish={() => setStep('register')}
            onReset={() => {
                setStep('inputPhone')
                Router.push(`/auth/register?${queryParams}`)
            }}
            title={ValidatePhoneTitle}
        />,
        register: <RegisterForm
            onFinish={handleFinish}
            onReset={() => {
                setStep('inputPhone')
                Router.push(`/auth/register?${queryParams}`)
            }}
        />,
    }), [ValidatePhoneTitle, handleFinish, queryParams])

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
        updateQuery(
            router,
            { newParameters: { step } },
            { routerAction: 'replace', resetOldParameters: false }
        )
    }, [step])
    
    useEffectOnce(() => {
        setCookie(AUTH_FLOW_USER_TYPE_COOKIE_NAME, 'staff', { maxAge: COOKIE_MAX_AGE_IN_SEC })
    })

    if (tokenError && token) {
        return (
            <>
                <Head><title>{title}</title></Head>
                <BasicEmptyListView>
                    <Row gutter={[0, 24]}>
                        <Col span={24}>
                            <Typography.Title level={3}>
                                {PhoneConfirmTokenErrorLabel}
                            </Typography.Title>
                            <Typography.Text>
                                {PhoneConfirmTokenErrorMessage}
                            </Typography.Text>
                        </Col>
                        <Col span={24}>
                            <Button
                                type='primary'
                                onClick={() => {
                                    setToken(null)
                                    setTokenError(null)
                                    setStep('inputPhone')
                                    Router.push('/auth/register')
                                }}
                                block
                            >
                                {RestartPhoneConfirmLabel}
                            </Button>
                        </Col>
                    </Row>
                </BasicEmptyListView>
            </>
        )
    }

    return (
        <>
            <Head><title>{title}</title></Head>
            {steps[step]}
        </>
    )
}

const HeaderAction: React.FC = () => {
    const router = useRouter()
    const { authFlow } = useAuthMethods()

    if (authFlow !== 'default') return null

    return router.query.step == 'inputPhone' && (
        <WelcomeHeaderTitle userType='staff'/>
    )
}

const RegisterLayout: React.FC<AuthLayoutProps> = ({ headerAction, children }) => {
    return (
        <AuthLayout headerAction={headerAction}>
            <RegisterContextProvider>
                {children}
            </RegisterContextProvider>
        </AuthLayout>
    )
}

RegisterPage.headerAction = <HeaderAction />
RegisterPage.container = RegisterLayout
RegisterPage.skipUserPrefetch = true

export default RegisterPage

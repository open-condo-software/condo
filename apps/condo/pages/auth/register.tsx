import { Row, Col } from 'antd'
import Head from 'next/head'
import Router, { useRouter } from 'next/router'
import React, { useCallback, useEffect, useState, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button, Typography } from '@open-condo/ui'

import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { PageComponentType } from '@condo/domains/common/types'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { InputPhoneForm } from '@condo/domains/user/components/auth/InputPhoneForm'
import { RegisterContextProvider, useRegisterContext } from '@condo/domains/user/components/auth/RegisterContextProvider'
import { RegisterForm } from '@condo/domains/user/components/auth/RegisterForm'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import AuthLayout, { AuthLayoutProps } from '@condo/domains/user/components/containers/AuthLayout'
import { WelcomeHeaderTitle } from '@condo/domains/user/components/UserWelcomeTitle'


const RegisterPage: PageComponentType = () => {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const PhoneConfirmTokenErrorLabel = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorLabel' })
    const PhoneConfirmTokenErrorMessage = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorMessage' })
    const RestartPhoneConfirmLabel = intl.formatMessage({ id: 'pages.auth.register.RestartPhoneConfirmLabel' })
    const router = useRouter()
    const { query: { next }  } = router
    const isValidNextUrl = next && !Array.isArray(next) && isSafeUrl(next)

    const { token, isConfirmed, tokenError, setToken, setTokenError } = useRegisterContext()
    const [step, setStep] = useState<'inputPhone' | 'validatePhone' | 'register'>('inputPhone')

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
                Router.push('/auth/register')
            }}
            title={RegistrationTitleMsg}
        />,
        register: <RegisterForm
            onFinish={handleFinish}
            onReset={() => {
                setStep('inputPhone')
                Router.push('/auth/register')
            }}
        />,
    }), [RegistrationTitleMsg, handleFinish])

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

    if (tokenError && token) {
        return (
            <>
                <Head><title>{RegistrationTitleMsg}</title></Head>
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
            {/* TODO(DOMA-9722): Dynamic title */}
            <Head><title>{RegistrationTitleMsg}</title></Head>
            {steps[step]}
        </>
    )
}

const HeaderAction: React.FC = () => {
    const router = useRouter()
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

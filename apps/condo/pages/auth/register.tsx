import { Button } from '@condo/domains/common/components/Button'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { InputPhoneForm } from '@condo/domains/user/components/auth/InputPhoneForm'
import { RegisterContext, RegisterContextProvider } from '@condo/domains/user/components/auth/RegisterContextProvider'
import { RegisterForm } from '@condo/domains/user/components/auth/RegisterForm'
import { ValidatePhoneForm } from '@condo/domains/user/components/auth/ValidatePhoneForm'
import AuthLayout, { AuthPage } from '@condo/domains/user/components/containers/AuthLayout'

import { useIntl } from '@core/next/intl'
import { Col, Row, Typography } from 'antd'
import Router from 'next/router'
import React, { useContext, useEffect, useState } from 'react'
import { ButtonHeaderAction } from '../../domains/common/components/HeaderActions'

const RegisterPage: AuthPage = () => {
    const intl = useIntl()
    const RegistrationTitleMsg = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const PhoneConfirmTokenErrorLabel = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorLabel' })
    const PhoneConfirmTokenErrorMessage = intl.formatMessage({ id: 'pages.auth.register.PhoneConfirmTokenErrorMessage' })
    const RestartPhoneConfirmLabel = intl.formatMessage({ id: 'pages.auth.register.RestartPhoneConfirmLabel' })

    const { token, isConfirmed, tokenError, setToken, setTokenError } = useContext(RegisterContext)
    const [state, setState] = useState('inputPhone')
    useEffect(() => {
        if (token && isConfirmed) {
            setState('register')
        } else if (token) {
            setState('validatePhone')
        } else {
            setState('inputPhone')
        }
    }, [token, isConfirmed])

    if (tokenError && token) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {PhoneConfirmTokenErrorLabel}
                </Typography.Title>
                <Typography.Text style={{ fontSize: '16px' }}>
                    {PhoneConfirmTokenErrorMessage}
                </Typography.Text>
                <Button
                    type='sberPrimary'
                    style={{ marginTop: '16px' }}
                    onClick={() => {
                        setToken(null)
                        setTokenError(null)
                        setState('inputPhone')
                        Router.push('/auth/register')
                    }}
                >
                    {RestartPhoneConfirmLabel}
                </Button>
            </BasicEmptyListView>
        )
    }

    const steps = {
        inputPhone: <InputPhoneForm onFinish={() => setState('validatePhone')} />,
        validatePhone: <ValidatePhoneForm onFinish={() => setState('register')} onReset={() => {
            setState('inputPhone')
            Router.push('/auth/register')
        }} />,
        register: <RegisterForm onFinish={() => null} />,
    }

    return (
        <RegisterContextProvider>
            <Row gutter={[0, 24]}>
                <Col span={24}>
                    <Typography.Title>{RegistrationTitleMsg}</Typography.Title>
                </Col>
                <Col span={24}>
                    { steps[state] }
                </Col>
            </Row>
        </RegisterContextProvider>
    )
}

RegisterPage.headerAction = (
    <ButtonHeaderAction
        descriptor={{ id: 'pages.auth.AlreadyRegistered' }}
        path={'/auth/signin'}
    />
)
RegisterPage.container = AuthLayout

export default RegisterPage

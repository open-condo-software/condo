import getConfig from 'next/config'
import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Tabs } from '@open-condo/ui'

import { PASSWORD_AUTH_METHOD } from '@/domains/common/constants/auth'

import { LoginForm } from './LoginForm'
import { RegisterForm } from './registration/RegisterForm'

const { publicRuntimeConfig: { authMethods } } = getConfig()

type AuthFormProps =  {
    onComplete: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ onComplete }) => {
    const intl = useIntl()
    const LoginTabLabel = intl.formatMessage({ id: 'global.authForm.Tabs.login' })
    const RegisterTabLabel = intl.formatMessage({ id: 'global.authForm.Tabs.register' })

    return  useMemo(() => {
        if (authMethods.includes(PASSWORD_AUTH_METHOD)) {
            return (
                <Tabs
                    centered
                    items={[
                        {
                            key: 'login',
                            label: LoginTabLabel,
                            children: <LoginForm onComplete={onComplete}/>,
                        },
                        {
                            key: 'register',
                            label: RegisterTabLabel,
                            children: <RegisterForm onComplete={onComplete}/>,
                        },
                    ]}
                    destroyInactiveTabPane
                />
            )
        } else {
            return <LoginForm onComplete={onComplete}/>
        }
    }, [LoginTabLabel, RegisterTabLabel, onComplete])
}
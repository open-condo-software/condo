import React from 'react'
import { useIntl } from 'react-intl'

import { Tabs } from '@open-condo/ui'

import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

type AuthFormProps =  {
    onComplete: () => void
}

export const AuthForm: React.FC<AuthFormProps> = ({ onComplete }) => {
    const intl = useIntl()
    const LoginTabLabel = intl.formatMessage({ id: 'global.authForm.Tabs.login' })
    const RegisterTabLabel = intl.formatMessage({ id: 'global.authForm.Tabs.register' })

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
                    children: <RegisterForm/>,
                },
            ]}
            destroyInactiveTabPane
        />
    )
}
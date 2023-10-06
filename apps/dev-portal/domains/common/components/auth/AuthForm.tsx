import React from 'react'
import { useIntl } from 'react-intl'

import { Tabs } from '@open-condo/ui'

export const AuthForm: React.FC = () => {
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
                },
                {
                    key: 'register',
                    label: RegisterTabLabel,
                    disabled: true,
                },
            ]}
        />
    )
}
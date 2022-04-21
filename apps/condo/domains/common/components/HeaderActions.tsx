import React, { useCallback, useEffect, useState } from 'react'
import { useIntl } from '@core/next/intl'
import Router, { useRouter } from 'next/router'
import { Space, Typography, Tabs } from 'antd'

interface ITabsActionsProps {
    currentActiveKey: string
}

export const TabsAuthAction: React.FC<ITabsActionsProps> = (props) => {
    const { currentActiveKey } = props
    const intl = useIntl()
    const registerTab = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const signInTab = intl.formatMessage({ id: 'SignIn' })

    return (
        <RemoveTabLineWrapper>
            <Tabs
                defaultActiveKey={currentActiveKey}
                onChange={(activeKey) => Router.push(activeKey)}
                centered
                animated={false}
            >
                <Tabs.TabPane key='/auth/register?step=inputPhone' tab={registerTab}/>
                <Tabs.TabPane key='/auth/signin' tab={signInTab}/>
            </Tabs>
        </RemoveTabLineWrapper>
    )
}

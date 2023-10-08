import { Tabs } from 'antd'
import Router from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { RemoveTabsLineWrapper } from '@condo/domains/user/components/containers/styles'

interface ITabsActionsProps {
    currentActiveKey: string
}

export const TabsAuthAction: React.FC<ITabsActionsProps> = (props) => {
    const { currentActiveKey } = props
    const intl = useIntl()
    const registerTab = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const signInTab = intl.formatMessage({ id: 'pages.auth.SignInTitle' })

    return (
        <RemoveTabsLineWrapper>
            <Tabs
                defaultActiveKey={currentActiveKey}
                onChange={(activeKey) => Router.push(activeKey)}
                centered
                animated={false}
            >
                <Tabs.TabPane key='/auth/register?step=inputPhone' tab={registerTab}/>
                <Tabs.TabPane key='/auth/signin' tab={signInTab}/>
            </Tabs>
        </RemoveTabsLineWrapper>
    )
}

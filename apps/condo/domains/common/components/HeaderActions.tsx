import { Tabs } from 'antd'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'

import { isSafeUrl } from '@condo/domains/common/utils/url.utils'
import { RemoveTabsLineWrapper } from '@condo/domains/user/components/containers/styles'

interface ITabsActionsProps {
    currentActiveKey: string
}

export const TabsAuthAction: React.FC<ITabsActionsProps> = (props) => {
    const { currentActiveKey } = props
    const intl = useIntl()
    const registerTab = intl.formatMessage({ id: 'pages.auth.RegistrationTitle' })
    const signInTab = intl.formatMessage({ id: 'pages.auth.SignInTitle' })

    const router = useRouter()
    const { query: { next }  } = router
    const isValidNextUrl = next && !Array.isArray(next) && isSafeUrl(next)

    return (
        <RemoveTabsLineWrapper>
            <Tabs
                defaultActiveKey={currentActiveKey}
                onChange={(activeKey) => {
                    if (activeKey === 'signin') {
                        router.push(isValidNextUrl ? `/auth/signin?next=${encodeURIComponent(next)}` : '/auth/signin')
                    } else if (activeKey === 'register') {
                        router.push(isValidNextUrl ? `/auth/register?step=inputPhone&next=${encodeURIComponent(next)}` : '/auth/register')
                    }}}
                centered
                animated={false}
            >
                <Tabs.TabPane key='register' tab={registerTab}/>
                <Tabs.TabPane key='signin' tab={signInTab}/>
            </Tabs>
        </RemoveTabsLineWrapper>
    )
}

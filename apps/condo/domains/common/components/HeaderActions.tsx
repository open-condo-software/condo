import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tabs } from '@open-condo/ui'

import { isSafeUrl } from '@condo/domains/common/utils/url.utils'


type TabsAuthActionsProps = {
    currentActiveKey: string
}

export const TabsAuthAction: React.FC<TabsAuthActionsProps> = (props) => {
    const { currentActiveKey } = props
    const intl = useIntl()
    const registerTab = intl.formatMessage({ id: 'pages.auth.register.step.inputPhone.title' })
    const signInTab = intl.formatMessage({ id: 'pages.auth.signin.title' })

    const router = useRouter()
    const { query: { next }  } = router
    const isValidNextUrl = next && !Array.isArray(next) && isSafeUrl(next)

    const handleChange = useCallback((activeKey: string): void => {
        if (activeKey === 'signin') {
            router.push(isValidNextUrl ? `/auth/signin?next=${encodeURIComponent(next)}` : '/auth/signin')
        } else if (activeKey === 'register') {
            router.push(isValidNextUrl ? `/auth/register?next=${encodeURIComponent(next)}` : '/auth/register')
        }
    }, [isValidNextUrl, next])

    const tabItems = useMemo(() => [
        { key: 'signin', label: signInTab },
        { key: 'register', label: registerTab },
    ], [registerTab, signInTab])

    return (
        <Tabs
            items={tabItems}
            defaultActiveKey={currentActiveKey}
            onChange={handleChange}
        />
    )
}

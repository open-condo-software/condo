import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tabs } from '@open-condo/ui'
import type { TabItem } from '@open-condo/ui'

import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY, EXTENSION_TAB_KEY } from '@condo/domains/billing/constants/constants'
import { useBillingQuery } from '@condo/domains/billing/hooks/useBillingQuery'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

type MainContentProps = {
    billingName: string
    extendsBillingPage: boolean
    appUrl?: string
    billingPageTitle?: string
}

export const MainContent: React.FC<MainContentProps> = ({
    billingName,
    extendsBillingPage,
    billingPageTitle,
    appUrl,
}) => {
    const intl = useIntl()
    const AccrualsTabTitle = intl.formatMessage({ id: 'Accruals' })
    const PaymentsTabTitle = intl.formatMessage({ id: 'Payments' })

    const shouldIncludeAppTab = Boolean(appUrl && extendsBillingPage)
    const [currentTab, onTabChange] = useBillingQuery(shouldIncludeAppTab)

    const extensionPageTitle = billingPageTitle || billingName

    const items = useMemo(() => {
        const result: Array<TabItem> = [
            { label: AccrualsTabTitle, key: ACCRUALS_TAB_KEY },
            { label: PaymentsTabTitle, key: PAYMENTS_TAB_KEY },
        ]

        if (shouldIncludeAppTab) {
            result.push({
                label: extensionPageTitle,
                key: EXTENSION_TAB_KEY,
                children: <IFrame src={appUrl} reloadScope='organization' withPrefetch withLoader withResize/>,
            })
        }

        return result
    }, [AccrualsTabTitle, PaymentsTabTitle, extensionPageTitle, shouldIncludeAppTab, appUrl])

    return (
        <Tabs
            activeKey={currentTab}
            onChange={onTabChange}
            items={items}
            destroyInactiveTabPane
        />
    )
}
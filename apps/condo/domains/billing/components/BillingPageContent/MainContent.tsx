import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tabs } from '@open-condo/ui'
import type { TabItem } from '@open-condo/ui'

import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY, EXTENSION_TAB_KEY } from '@condo/domains/billing/constants/constants'
import { useQueryTab } from '@condo/domains/billing/hooks/useQueryTab'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

import { AccrualsTab } from './AccrualsTab'
import { useBillingAndAcquiringContexts } from './ContextProvider'
import { PaymentsTab } from './PaymentsTab'

type MainContentProps = {
    uploadComponent?: React.ReactElement
}

export const MainContent: React.FC<MainContentProps> = ({
    uploadComponent,
}) => {
    const intl = useIntl()
    const AccrualsTabTitle = intl.formatMessage({ id: 'accruals' })
    const PaymentsTabTitle = intl.formatMessage({ id: 'payments' })

    const { billingContext } = useBillingAndAcquiringContexts()
    const appUrl = get(billingContext, ['integration', 'appUrl'])
    const extendsBillingPage = get(billingContext, ['integration', 'extendsBillingPage'], false)
    const billingName = get(billingContext, ['integration', 'name'], '')
    const billingPageTitle = get(billingContext, ['integration', 'billingPageTitle'])


    const shouldIncludeAppTab = Boolean(appUrl && extendsBillingPage)
    const [currentTab, onTabChange] = useQueryTab(shouldIncludeAppTab)

    const extensionPageTitle = billingPageTitle || billingName

    const items = useMemo(() => {
        const result: Array<TabItem> = [{
            label: AccrualsTabTitle,
            key: ACCRUALS_TAB_KEY,
            children: <AccrualsTab uploadComponent={uploadComponent}/>,
        },
        {
            label: PaymentsTabTitle,
            key: PAYMENTS_TAB_KEY,
            children: <PaymentsTab/>,
        }]

        if (shouldIncludeAppTab) {
            result.push({
                label: extensionPageTitle,
                key: EXTENSION_TAB_KEY,
                children: <IFrame src={appUrl} reloadScope='organization' withPrefetch withLoader withResize/>,
            })
        }

        return result
    }, [
        AccrualsTabTitle,
        PaymentsTabTitle,
        extensionPageTitle,
        shouldIncludeAppTab,
        appUrl,
        uploadComponent,
    ])

    return (
        <Tabs
            activeKey={currentTab}
            onChange={onTabChange}
            items={items}
            destroyInactiveTabPane
        />
    )
}
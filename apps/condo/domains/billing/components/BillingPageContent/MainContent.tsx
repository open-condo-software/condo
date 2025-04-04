import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Tabs } from '@open-condo/ui'
import type { TabItem } from '@open-condo/ui'

import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY, EXTENSION_TAB_KEY } from '@condo/domains/billing/constants/constants'
import { useQueryTab } from '@condo/domains/billing/hooks/useQueryTab'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

import { AccrualsTab } from './AccrualsTab'
import { useBillingAndAcquiringContexts } from './ContextProvider'
import { EmptyContent } from './EmptyContent'
import { PaymentsTab } from './PaymentsTab'


type MainContentProps = {
    uploadComponent?: React.ReactElement
}

export const MainContent: React.FC<MainContentProps> = ({
    uploadComponent,
}) => {
    const intl = useIntl()
    const AccrualsTabTitle = intl.formatMessage({ id: 'Accruals' })
    const PaymentsTabTitle = intl.formatMessage({ id: 'Payments' })

    const userOrganization = useOrganization()
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)

    const { billingContexts } = useBillingAndAcquiringContexts()

    const extension = billingContexts.find(({ integration }) => !!integration.appUrl && !!integration.extendsBillingPage)
    const hasLastReport = billingContexts.find(({ lastReport }) => !!lastReport)
    const [currentTab, onTabChange] = useQueryTab(!!extension)


    const items = useMemo(() => {
        const result: Array<TabItem> = [
            canReadBillingReceipts && {
                label: AccrualsTabTitle,
                key: ACCRUALS_TAB_KEY,
                children: hasLastReport ? <AccrualsTab uploadComponent={uploadComponent}/> : <EmptyContent uploadComponent={uploadComponent}/>,
            },
            canReadPayments && {
                label: PaymentsTabTitle,
                key: PAYMENTS_TAB_KEY,
                children: <PaymentsTab/>,
            }]

        if (extension) {
            result.push({
                label: get(extension, ['integration', 'billingPageTitle']) || get(extension, ['integration', 'name'], ''),
                key: EXTENSION_TAB_KEY,
                children: <IFrame src={get(extension, ['integration', 'appUrl'])} reloadScope='organization' withPrefetch withLoader withResize />,
            })
        }

        return result
    }, [canReadBillingReceipts, AccrualsTabTitle, hasLastReport, uploadComponent, canReadPayments, PaymentsTabTitle, extension])

    return (
        <Tabs
            activeKey={currentTab}
            onChange={onTabChange}
            items={items}
            destroyInactiveTabPane
        />
    )
}
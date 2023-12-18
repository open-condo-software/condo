import { Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { TabItem, Tabs, Tag } from '@open-condo/ui'
import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { CONTEXT_FINISHED_STATUS } from '@condo/domains/acquiring/constants/context'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { MarketplaceInvoicesContent } from '@condo/domains/marketplace/components/Invoice/MarketplaceInvoicesContent'
import { MarketplaceItemsContent } from '@condo/domains/marketplace/components/MarketItemContent'
import { MarketplacePaymentsContent } from '@condo/domains/marketplace/components/MarketplacePaymentsContent'
import { useQueryTab } from '@condo/domains/marketplace/hooks/useQueryTab'
import { MARKETPLACE_PAGE_TYPES } from '@condo/domains/marketplace/utils/clientSchema'

import { useAcquiringContext } from './ContextProvider'


export const MarketplacePageContent = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'pages.condo.marketplace.title' })
    const TagText = intl.formatMessage({ id: 'pages.condo.marketplace.notSetup.tag' })
    const NotSetupTitle = intl.formatMessage({ id: 'pages.condo.marketplace.notSetup.title' })
    const NotSetupText = intl.formatMessage({ id: 'pages.condo.marketplace.notSetup.text' })
    const NotSetupButton = intl.formatMessage({ id: 'pages.condo.marketplace.notSetup.buttonText' })
    const BillsTab = intl.formatMessage({ id: 'pages.condo.marketplace.tab.bill' })
    const PaymentsTab = intl.formatMessage({ id: 'pages.condo.marketplace.tab.payments' })
    const ServicesTab = intl.formatMessage({ id: 'pages.condo.marketplace.tab.services' })

    const { GlobalHints } = useGlobalHints()
    const [currentTab, onTabChange] = useQueryTab([MARKETPLACE_PAGE_TYPES.bills, MARKETPLACE_PAGE_TYPES.payments, MARKETPLACE_PAGE_TYPES.services])

    const router = useRouter()
    const userOrganization = useOrganization()
    const { acquiringContext } = useAcquiringContext()
    const marketplaceIsSetup = acquiringContext && get(acquiringContext, 'invoiceStatus') === CONTEXT_FINISHED_STATUS
    const role = get(userOrganization, ['link', 'role'], {})
    const canReadPayments = get(role, ['canReadPayments'], false)
    const canManageInvoices = get(role, ['canManageInvoices'], false)

    const RenderNotSetupTag = useMemo(() => {
        if (!marketplaceIsSetup) {
            return <Tag bgColor={colors.pink['1']} textColor={colors.pink['5']}>{TagText}</Tag>
        }
    }, [TagText, marketplaceIsSetup])

    const handleGoToSetup = ()=> {
        router.push('/marketplace/setup')
    }

    const items = useMemo(() => {
        const result: Array<TabItem> = [
            canManageInvoices && {
                label: BillsTab,
                key: MARKETPLACE_PAGE_TYPES.bills,
                children: <MarketplaceInvoicesContent/>,
            },
            canReadPayments && {
                label: PaymentsTab,
                key: MARKETPLACE_PAGE_TYPES.payments,
                children: <MarketplacePaymentsContent/>,
            },
            {
                label: ServicesTab,
                key: MARKETPLACE_PAGE_TYPES.services,
                children: <MarketplaceItemsContent/>,
            }]

        return result
    }, [BillsTab, PaymentsTab, ServicesTab, canManageInvoices, canReadPayments])

    return (
        <PageWrapper>
            {GlobalHints}
            <PageHeader tags={RenderNotSetupTag} title={<Typography.Title>{PageTitle}</Typography.Title>} />
            {!marketplaceIsSetup ? (
                <EmptyListView image='dino/playing@2x.png' message={NotSetupText} label={NotSetupTitle} createLabel={NotSetupButton} button={
                    <Button type='primary' onClick={handleGoToSetup}>{NotSetupButton}</Button>
                }/>
            ) : (
                <Tabs
                    activeKey={currentTab}
                    onChange={onTabChange}
                    items={items}
                    destroyInactiveTabPane
                />
            )}
        </PageWrapper>
    )
}

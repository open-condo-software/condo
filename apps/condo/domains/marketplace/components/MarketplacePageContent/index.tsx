import { Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, TabItem, Tabs, Tag } from '@open-condo/ui'
import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { MarketplacePaymentsContent } from '@condo/domains/marketplace/components/MarketplacePaymentsContent'
import { INVOICE_CONTEXT_STATUS_FINISHED } from '@condo/domains/marketplace/constants'
import { useQueryTab } from '@condo/domains/marketplace/hooks/useQueryTab'
import { InvoiceContext, MARKETPLACE_PAGE_TYPES } from '@condo/domains/marketplace/utils/clientSchema'


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
    const BillsEmptyTitle = intl.formatMessage({ id: 'pages.condo.marketplace.bills.empty.title' })
    const BillsEmptyText = intl.formatMessage({ id: 'pages.condo.marketplace.bills.empty.text' })
    const BillsEmptyButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.bills.empty.buttonText' })
    const PaymentsEmptyTitle = intl.formatMessage({ id: 'pages.condo.marketplace.payments.empty.title' })
    const PaymentsEmptyText = intl.formatMessage({ id: 'pages.condo.marketplace.payments.empty.text' })
    const ServicesEmptyTitle = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.title' })
    const ServicesEmptyText = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.text' })
    const ServicesEmptyButtonText = intl.formatMessage({ id: 'pages.condo.marketplace.services.empty.buttonText' })

    const { GlobalHints } = useGlobalHints()
    const [currentTab, onTabChange] = useQueryTab([MARKETPLACE_PAGE_TYPES.bills, MARKETPLACE_PAGE_TYPES.payments, MARKETPLACE_PAGE_TYPES.services])

    const router = useRouter()
    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const { obj: invoiceContext, loading: invoiceLoading, error: invoiceError, refetch: refetchInvoice } = InvoiceContext.useObject({
        where: {
            status: INVOICE_CONTEXT_STATUS_FINISHED,
            organization: { id: orgId },
        },
    })

    const marketplaceIsSetup = invoiceContext && get(invoiceContext, 'status') === INVOICE_CONTEXT_STATUS_FINISHED
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
            {
                label: BillsTab,
                key: MARKETPLACE_PAGE_TYPES.bills,
                children: <EmptyListView
                    label={BillsEmptyTitle}
                    message={BillsEmptyText}
                    createLabel={BillsEmptyButtonText}
                    createRoute='/marketplace/invoice/create'
                    accessCheck={canManageInvoices}
                />,
            },
            canReadPayments && {
                label: PaymentsTab,
                key: MARKETPLACE_PAGE_TYPES.payments,
                children: <MarketplacePaymentsContent/>,
            },
            {
                label: ServicesTab,
                key: MARKETPLACE_PAGE_TYPES.services,
                children: <EmptyListView label={ServicesEmptyTitle} message={ServicesEmptyText} button={
                    <Button type='primary'>{ServicesEmptyButtonText}</Button>
                }/>,
            }]

        return result
    }, [BillsEmptyButtonText, BillsEmptyText, BillsEmptyTitle, BillsTab, PaymentsEmptyText, PaymentsEmptyTitle, PaymentsTab, ServicesEmptyButtonText, ServicesEmptyText, ServicesEmptyTitle, ServicesTab, canReadPayments])

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

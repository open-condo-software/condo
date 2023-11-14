import { Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { TabItem, Tabs, Tag } from '@open-condo/ui'
import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { useQueryTab } from '@condo/domains/common/hooks/useQueryTab'
import { INVOICE_CONTEXT_STATUS_FINISHED } from '@condo/domains/marketplace/constants'
import { BILLS_TAB_KEY, SERVICES_TAB_KEY, PAYMENTS_TAB_KEY } from '@condo/domains/marketplace/constants'
import { InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'


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
    const [currentTab, onTabChange] = useQueryTab([BILLS_TAB_KEY, PAYMENTS_TAB_KEY, SERVICES_TAB_KEY])

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
    const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)
    const canManageInvoices = get(userOrganization, ['link', 'role', 'canManageInvoices'], false)

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
                key: BILLS_TAB_KEY,
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
                key: PAYMENTS_TAB_KEY,
                children: <EmptyListView label={PaymentsEmptyTitle} message={PaymentsEmptyText}/>,
            },
            {
                label: ServicesTab,
                key: SERVICES_TAB_KEY,
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

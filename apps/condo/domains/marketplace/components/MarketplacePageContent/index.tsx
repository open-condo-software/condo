import { SortPaymentsBy } from '@app/condo/schema'
import { Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Modal, TabItem, Tabs, Tag } from '@open-condo/ui'
import { Button } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { EmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useGlobalHints } from '@condo/domains/common/hooks/useGlobalHints'
import { useQueryMappers } from '@condo/domains/common/hooks/useQueryMappers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'
import { MarketplacePaymentsContent } from '@condo/domains/marketplace/components/MarketplacePaymentsContent'
import { INVOICE_CONTEXT_STATUS_FINISHED } from '@condo/domains/marketplace/constants'
import { useFilters } from '@condo/domains/marketplace/hooks/useFilters'
import { useQueryTab } from '@condo/domains/marketplace/hooks/useQueryTab'
import { useTableColumns } from '@condo/domains/marketplace/hooks/useTableColumns'
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
    const ConfirmTitle = intl.formatMessage({ id: 'component.TicketWarningModal.ConfirmTitle' })

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

    const filterMetas = useFilters(currentTab)
    const { filtersToWhere, sortersToSortBy } = useQueryMappers(filterMetas, [])
    const { filters, sorters } = parseQuery(router.query)

    const [isStatusDescModalVisible, setIsStatusDescModalVisible] = useState<boolean>(false)
    const [titleStatusDescModal, setTitleStatusDescModal] = useState('')
    const [textStatusDescModal, setTextStatusDescModal] = useState('')
    const openStatusDescModal = (statusType) => {
        const titleModal = intl.formatMessage({ id: 'payment.status.description.title.' + statusType })
        const textModal = intl.formatMessage({ id: 'payment.status.description.text.' + statusType })

        setTitleStatusDescModal(titleModal)
        setTextStatusDescModal(textModal)
        setIsStatusDescModalVisible(true)
    }
    const tableColumns = useTableColumns(filterMetas, currentTab, openStatusDescModal)

    const searchPaymentsQuery = useMemo(() => {
        return {
            invoice: {
                context: {
                    organization: { id: orgId },
                },
            },
        }},
    [filters, filtersToWhere, orgId])
    const sortBy = useMemo(() => sortersToSortBy(sorters) as SortPaymentsBy[], [sorters, sortersToSortBy])

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
                children: <MarketplacePaymentsContent
                    filterMetas={filterMetas}
                    searchPaymentsQuery={searchPaymentsQuery}
                    role={role}
                    sortBy={sorters}
                    tableColumns={tableColumns}
                />,
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
            <Modal
                open={isStatusDescModalVisible}
                onCancel={() => setIsStatusDescModalVisible(false)}
                title={titleStatusDescModal}
                footer={[
                    <Button
                        key='close'
                        type='secondary'
                        onClick={() => setIsStatusDescModalVisible(false)}
                    >
                        {ConfirmTitle}
                    </Button>,
                ]}
            >
                <Typography.Text type='secondary'>
                    {textStatusDescModal}
                </Typography.Text>
            </Modal>
        </PageWrapper>
    )
}

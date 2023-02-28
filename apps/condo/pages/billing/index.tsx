import { Tabs } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import PaymentsPageContent from '@condo/domains/acquiring/components/payments/PaymentsPageContent'
import { BillingPageContent } from '@condo/domains/billing/components/BillingPageContent'
import { BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { CONTEXT_FINISHED_STATUS } from '@condo/domains/miniapp/constants'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

type PageType = React.FC & {
    requiredAccess: React.FC
}

const ACCRUALS_TAB_KEY = 'accruals'
const PAYMENTS_TAB_KEY = 'payments'
const ALL_TAB_KEYS = [ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY]

const AccrualsAndPaymentsPage: PageType = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.accrualsAndPayments' })
    const AccrualsTitle = intl.formatMessage({ id: 'Accruals' })
    const PaymentsTitle = intl.formatMessage({ id: 'Payments' })

    const router = useRouter()
    const { query: { tab } } = router

    const handleTabChange = useCallback((activeKey: string) => {
        const newPath = `${router.route}?tab=${activeKey}`
        router.push(newPath)
    }, [router])

    const defaultTab = useMemo(() =>
        (tab && !Array.isArray(tab) && ALL_TAB_KEYS.includes(tab.toLowerCase()))
            ? tab.toLowerCase()
            : ACCRUALS_TAB_KEY
    , [tab])

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], '')
    // TODO(DOMA-5444): Rewrite fetch logic with multiple setup states
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)

    const {
        obj: billingContext,
        error: billingContextError,
        loading: billingContextLoading,
    } = BillingIntegrationOrganizationContext.useObject({
        where: {
            organization: {
                id: organizationId,
            },
            status: CONTEXT_FINISHED_STATUS,
        },
    }, {
        fetchPolicy: 'network-only',
    })


    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>}/>
                <TablePageContent>
                    <Tabs
                        defaultActiveKey={defaultTab}
                        tabBarStyle={{ marginBottom: 40 }}
                        onChange={handleTabChange}
                    >
                        <Tabs.TabPane key={ACCRUALS_TAB_KEY} tab={AccrualsTitle}>
                            <BillingPageContent
                                access={canReadBillingReceipts}
                                contextLoading={billingContextLoading}
                                contextError={billingContextError}
                                context={billingContext}
                            />
                        </Tabs.TabPane>
                        <Tabs.TabPane key={PAYMENTS_TAB_KEY} tab={PaymentsTitle}>
                            <PaymentsPageContent/>
                        </Tabs.TabPane>
                    </Tabs>
                </TablePageContent>
            </PageWrapper>
        </>
    )
}
AccrualsAndPaymentsPage.requiredAccess = OrganizationRequired

export default AccrualsAndPaymentsPage
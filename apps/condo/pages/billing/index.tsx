import { Typography } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { BillingPageContent } from '@condo/domains/billing/components/BillingPageContent'
import { BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { TablePageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'

const BillingPage = () => {
    const intl = useIntl()
    const BillingTitle = intl.formatMessage({ id:'global.section.billing' })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], '')
    const canReadBillingReceipts = get(userOrganization, ['link', 'role', 'canReadBillingReceipts'], false)
    const {
        obj: currentContext,
        error: contextError,
        loading: contextLoading,
    } = BillingIntegrationOrganizationContext.useObject({
        where: {
            organization: {
                id: organizationId,
            },
        },
    }, {
        fetchPolicy: 'network-only',
    })

    const PageTitle = get(currentContext, ['integration', 'billingPageTitle'], BillingTitle)

    return (
        <>
            <Head>
                <title>
                    {BillingTitle}
                </title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title style={{ margin: 0 }}>{PageTitle}</Typography.Title>}/>
                <TablePageContent>
                    <BillingPageContent
                        access={canReadBillingReceipts}
                        contextLoading={contextLoading}
                        contextError={contextError}
                        context={currentContext}
                    />
                </TablePageContent>
            </PageWrapper>
        </>
    )
}

BillingPage.requiredAccess = OrganizationRequired

export default BillingPage

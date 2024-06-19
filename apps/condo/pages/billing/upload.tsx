import get from 'lodash/get'
import getConfig from 'next/config'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { CONTEXT_FINISHED_STATUS, CONTEXT_VERIFICATION_STATUS } from '@condo/domains/acquiring/constants/context'
import { AcquiringIntegrationContext as AcquiringContext } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingAndAcquiringContext } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import { PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageContent } from '@condo/domains/common/components/containers/BaseLayout/BaseLayout'
import { Header } from '@condo/domains/common/components/containers/BaseLayout/Header'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { CONTEXT_FINISHED_STATUS as BILLING_FINISHED_STATUS } from '@condo/domains/miniapp/constants'


const { publicRuntimeConfig: { registryConfig, sppConfig } } = getConfig()

const Upload = () => {
    const PageTitle = 'Загрузка нового реестра'

    // const { billingContext, refetchBilling } = useBillingAndAcquiringContexts()

    const router = useRouter()
    const mode = get(router.query, 'mode') as string || null

    const userOrganization = useOrganization()
    const orgId = get(userOrganization, ['organization', 'id'], null)
    const canImportBillingReceipts = get(userOrganization, ['link', 'role', 'canImportBillingReceipts'], false)

    const { obj: billingContext, loading: billingLoading, error: billingError, refetch: refetchBilling } = BillingContext.useObject({
        where: {
            status: BILLING_FINISHED_STATUS,
            organization: { id: orgId },
            integration: { id_in: [registryConfig.id, sppConfig.id] },
        },
    })
    const { obj: acquiringCtx, loading: acquiringLoading, error: acquiringError, refetch: refetchAcquiring } = AcquiringContext.useObject({
        where: {
            status_in: [CONTEXT_FINISHED_STATUS, CONTEXT_VERIFICATION_STATUS],
            organization: { id: orgId },
        },
    })
    const uploadUrl = get(billingContext, ['integration', 'uploadUrl'])
    console.log('billingContext: ', billingContext)


    
    if (billingLoading || acquiringLoading) {
        return null
    }

    if (!uploadUrl || !canImportBillingReceipts) {
        return null
    }

    return (
        <>
            <Head>
                <title>{PageTitle}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title >{PageTitle}</Typography.Title>} />
                <IFrame src={uploadUrl} reloadScope='organization' withPrefetch withLoader withResize/>
            </PageWrapper>
        </>
    )
}

export default Upload
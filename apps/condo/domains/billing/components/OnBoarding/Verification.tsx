import { SortAcquiringIntegrationContextsBy, SortBillingIntegrationOrganizationContextsBy } from '@app/condo/schema'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { CSSProperties, useEffect } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { CONTEXT_VERIFICATION_STATUS } from '@condo/domains/acquiring/constants/context'
import { AcquiringIntegrationContext as AcquiringContext } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'
import { CONTEXT_FINISHED_STATUS as BILLING_FINISHED_STATUS } from '@condo/domains/miniapp/constants'


const IMAGE_STYLES: CSSProperties = { marginBottom: 32 }

export const Verification: React.FC = () => {
    const intl = useIntl()
    const MessageTitle = intl.formatMessage({ id: 'accrualsAndPayments.setup.verificationStep.message.title' })
    const MessageBody = intl.formatMessage({ id: 'accrualsAndPayments.setup.verificationStep.message.body' })

    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)

    const { objs: billingContexts, loading: billingCtxLoading, error: billingCtxError } = BillingContext.useObjects({
        where: {
            status: BILLING_FINISHED_STATUS,
            organization: { id: orgId },
        },
        sortBy: [
            SortBillingIntegrationOrganizationContextsBy.UpdatedAtDesc,
            SortBillingIntegrationOrganizationContextsBy.IdDesc,
        ],
    })

    const { objs: acquiringContexts, loading: acquiringCtxLoading, error: acquiringCtxError } = AcquiringContext.useObjects({
        where: {
            status: CONTEXT_VERIFICATION_STATUS,
            organization: { id: orgId },
        },
        sortBy: [
            SortAcquiringIntegrationContextsBy.UpdatedAtDesc,
            SortAcquiringIntegrationContextsBy.IdDesc,
        ],
    })

    const billingCtx = billingContexts[0] || null
    const acquiringCtx = acquiringContexts[0] || null
    const billingCtxId = get(billingCtx, 'id', null)
    const acquiringCtxId = get(acquiringCtx, 'id', null)

    useEffect(() => {
        // If no billing = redirect to step 0
        if (!billingCtxLoading && !billingCtxError && !billingCtxId) {
            router.replace({ query: { step: 0 } }, undefined, { shallow: true })

        } else if (!acquiringCtxLoading && !acquiringCtxError && !acquiringCtxId) {
            // At this stage billing is connected 100%,
            // but if acquiring was also connected -> we should not see self-service (and this step at all)
            // so if there's no acquiring in verification step = need to connect it = should go to step 2
            router.replace({ query: { step: 2 } }, undefined, { shallow: true })
        }
    }, [
        billingCtxLoading,
        billingCtxError,
        billingCtxId,
        acquiringCtxLoading,
        acquiringCtxError,
        acquiringCtxId,
        router,
    ])

    if (acquiringCtxError || billingCtxError) {
        return <Typography.Title>{acquiringCtxError || billingCtxError}</Typography.Title>
    }

    
    if (acquiringCtxLoading || billingCtxLoading) {
        return <Loader fill size='large'/>
    }

    return (
        <BasicEmptyListView
            image='/dino/processing@2x.png'
            spaceSize={16}
            imageStyle={IMAGE_STYLES}
        >
            <Typography.Title level={3}>
                {MessageTitle}
            </Typography.Title>
            <Typography.Paragraph type='secondary'>
                {MessageBody}
            </Typography.Paragraph>
        </BasicEmptyListView>
    )
}

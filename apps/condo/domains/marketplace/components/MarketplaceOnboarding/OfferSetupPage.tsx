import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'

import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { INVOICE_CONTEXT_STATUS_INPROGRESS, MARKETPLACE_SETUP_URL_PATH } from '@condo/domains/marketplace/constants'
import { InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

type SetupAcquiringProps = {
    onFinish: () => void
}

export const OfferSetupPage: React.FC<SetupAcquiringProps> = ({ onFinish }) => {
    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)

    const { obj: invoiceContext, loading: invoiceContextLoading, error: invoiceContextError } = InvoiceContext.useObject({
        where: {
            status: INVOICE_CONTEXT_STATUS_INPROGRESS,
            organization: { id: orgId },
        },
    })

    const invoiceContextId = get(invoiceContext, 'id', null)
    const acquiringIntegrationHostUrl = get(invoiceContext, ['integration', 'hostUrl'])

    useEffect(() => {
        // No connected invoice context = go to setup beginning
        if (!invoiceContextLoading && !invoiceContextError && !invoiceContextId) {
            router.replace({ query: { step: 0 } })
        }
    }, [
        invoiceContextError,
        invoiceContextLoading,
        invoiceContextId,
        router,
    ])

    const setupUrl = `${acquiringIntegrationHostUrl}${MARKETPLACE_SETUP_URL_PATH}`
    const setupOrigin = extractOrigin(setupUrl)

    const handleDoneMessage = useCallback((event: MessageEvent) => {
        if (event.origin === setupOrigin && get(event.data, 'success') === true) {
            onFinish()
        }
    }, [setupOrigin, onFinish])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', handleDoneMessage)

            return () => window.removeEventListener('message', handleDoneMessage)
        }
    }, [handleDoneMessage])


    if (invoiceContextError) {
        return <Typography.Title>{invoiceContextError}</Typography.Title>
    }

    if (invoiceContextLoading) {
        return <Loader fill size='large'/>
    }

    return (
        <IFrame
            src={setupUrl}
            reloadScope='organization'
            withPrefetch
            withLoader
            withResize
        />
    )
}

import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'


import { useOrganization } from '@open-condo/next/organization'

import { AcquiringIntegrationContext as AcquiringIntegrationContextApi } from '@condo/domains/acquiring/utils/clientSchema'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { MARKETPLACE_SETUP_URL_PATH } from '@condo/domains/marketplace/constants'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'


type SetupAcquiringProps = {
    onFinish: () => void
}

export const OfferSetupPage: React.FC<SetupAcquiringProps> = ({ onFinish }) => {
    const router = useRouter()

    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const {
        obj: acquiringContext,
        loading: acquiringContextLoading,
        error: acquiringContextError,
    } = AcquiringIntegrationContextApi.useObject({
        where: {
            organization: { id: orgId },
        },
    })

    const acquiringContextId = get(acquiringContext, 'id', null)
    const acquiringIntegrationHostUrl = get(acquiringContext, ['integration', 'hostUrl'])

    useEffect(() => {
        if (
            (!acquiringContextLoading && !acquiringContextError)
            && (
                !acquiringContextId
                || !get(acquiringContext, ['invoiceRecipient', 'bankAccount'])
                || !get(acquiringContext, ['invoiceRecipient', 'bic'])
                || !get(acquiringContext, ['invoiceRecipient', 'tin'])
                || !get(acquiringContext, 'invoiceTaxRegime')
            )
        ) {
            router.replace({ query: { step: 0 } }, undefined, { shallow: true })
        }
    }, [acquiringContextId, router, acquiringContext, acquiringContextLoading, acquiringContextError])

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

    if (!acquiringContext || !!acquiringContextLoading || !!acquiringContextError) {
        return <LoadingOrErrorPage loading={acquiringContextLoading} error={acquiringContextError}/>
    }

    return <IFrame src={setupUrl} reloadScope='organization' withPrefetch withLoader withResize initialHeight={400}/>
}

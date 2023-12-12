import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { useAcquiringContext } from '@condo/domains/marketplace/components/MarketplacePageContent/ContextProvider'
import { MARKETPLACE_SETUP_URL_PATH } from '@condo/domains/marketplace/constants'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

type SetupAcquiringProps = {
    onFinish: () => void
}

export const OfferSetupPage: React.FC<SetupAcquiringProps> = ({ onFinish }) => {
    const router = useRouter()

    const { acquiringContext } = useAcquiringContext()

    const acquiringContextId = get(acquiringContext, 'id', null)
    const acquiringIntegrationHostUrl = get(acquiringContext, ['integration', 'hostUrl'])

    useEffect(() => {
        if (
            !acquiringContextId
            || !get(acquiringContext, ['invoiceRecipient', 'bankAccount'])
            || !get(acquiringContext, ['invoiceRecipient', 'bic'])
            || !get(acquiringContext, ['invoiceRecipient', 'tin'])
            || !get(acquiringContext, 'invoiceTaxRegime')
        ) {
            router.replace({ query: { step: 0 } })
        }
    }, [acquiringContextId, router, acquiringContext])

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

    if (!acquiringContext) {
        return null
    }

    return <IFrame src={setupUrl} reloadScope='organization' withPrefetch withLoader withResize/>
}

import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect } from 'react'

import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { AcquiringIntegrationContext as AcquiringContext, AcquiringIntegration } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingIntegrationOrganizationContext as BillingContext } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { CONTEXT_FINISHED_STATUS, CONTEXT_IN_PROGRESS_STATUS } from '@condo/domains/miniapp/constants'

type SetupAcquiringProps = {
    onFinish: () => void
}

export const SetupAcquiring: React.FC<SetupAcquiringProps> = ({ onFinish }) => {
    const router = useRouter()
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)

    const createAction = AcquiringContext.useCreate({
        status: CONTEXT_IN_PROGRESS_STATUS,
        settings: { dv: 1 },
        state: { dv: 1 },
    })
    const updateAction = AcquiringContext.useUpdate({
        status: CONTEXT_FINISHED_STATUS,
    })

    const { obj: billingCtx, loading: billingCtxLoading, error: billingCtxError } = BillingContext.useObject({
        where: {
            status: CONTEXT_FINISHED_STATUS,
            organization: { id: orgId },
        },
    })

    // NOTE: On practice there's only 1 acquiring and there's no plans to change it soon
    const { objs: acquiring, loading: acquiringLoading, error: acquiringError } = AcquiringIntegration.useObjects({
        where: {
            isHidden: false,
            setupUrl_not: null,
        },
    })

    const acquiringId = get(acquiring, ['0', 'id'], null)

    const { obj: acquiringCtx, loading: acquiringCtxLoading, error: acquiringCtxError, refetch: refetchCtx } = AcquiringContext.useObject({
        where: {
            integration: { id: acquiringId },
            organization: { id: orgId },
        },
    })



    const billingCtxId = get(billingCtx, 'id', null)
    const acquiringCtxId = get(acquiringCtx, 'id', null)

    // No connected billing = go to setup beginning
    useEffect(() => {
        if (!billingCtxLoading && !billingCtxError && !billingCtxId) {
            router.replace({ query: { step: 0 } })
        }
    }, [billingCtxLoading, billingCtxError, billingCtxId, router])

    // If no context for selected acquiring => need to create it and re-fetch
    useEffect(() => {
        if ((!acquiringLoading && !acquiringError) &&
            (!acquiringCtxLoading && !acquiringCtxError) &&
            (acquiringId && orgId && !acquiringCtxId)) {
            createAction({
                organization: { connect: { id: orgId } },
                integration: { connect: { id: acquiringId } },
            }).then(() => {
                refetchCtx()
            })
        }
        // NOTE: Does not include createAction and refetch in deps,
        // since it will trigger createContext twice and useObject will be broken :)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        acquiringLoading,
        acquiringError,
        acquiringCtxLoading,
        acquiringCtxError,
        acquiringId,
        acquiringCtxId,
        orgId,
    ])

    const setupUrl = get(acquiringCtx, ['integration', 'setupUrl'], '')
    const setupOrigin = extractOrigin(setupUrl)

    const handleDoneMessage = useCallback((event: MessageEvent) => {
        if (event.origin === setupOrigin && get(event.data, 'success') === true) {
            updateAction({}, { id: acquiringCtxId })
                .then(() => {
                    onFinish()
                })
        }
    }, [acquiringCtxId, setupOrigin, updateAction, onFinish])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('message', handleDoneMessage)

            return () => window.removeEventListener('message', handleDoneMessage)
        }
    }, [handleDoneMessage])

    if (acquiringError || acquiringCtxError || billingCtxError) {
        return <Typography.Title>{acquiringError || acquiringCtxError || billingCtxError}</Typography.Title>
    }

    // NOTE: !setupUrl = case when useEffect for creating ctx is being triggered, but not finished yet
    if (acquiringLoading || acquiringCtxLoading || billingCtxLoading || !setupUrl) {
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
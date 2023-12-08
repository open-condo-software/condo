import {
    AcquiringIntegration,
    AcquiringIntegrationContext, AcquiringIntegrationContextWhereInput,
    QueryAllAcquiringIntegrationContextsArgs,
} from '@app/condo/schema'
import get from 'lodash/get'

import { IRefetchType } from '@open-condo/codegen/generate.hooks'
import { useOrganization } from '@open-condo/next/organization'

import { AcquiringIntegrationContext as AcquiringIntegrationContextApi, AcquiringIntegration as AcquiringIntegrationApi } from '@condo/domains/acquiring/utils/clientSchema'

type TUseAcquiringIntegrationContext = {
    loading: boolean,
    error: string,
    acquiringIntegration: AcquiringIntegration,
    acquiringIntegrationContext: AcquiringIntegrationContext,
    refetchAcquiringIntegrationContext: IRefetchType<AcquiringIntegrationContext, QueryAllAcquiringIntegrationContextsArgs>,
}

export function useAcquiringIntegrationContext ({ status = undefined, invoiceStatus = undefined } = {}): TUseAcquiringIntegrationContext {
    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)

    // NOTE: On practice there's only 1 acquiring and there's no plans to change it soon
    const { objs: acquiring, loading: acquiringLoading, error: acquiringError } = AcquiringIntegrationApi.useObjects({
        where: {
            isHidden: false,
            setupUrl_not: null,
        },
    })

    const acquiringId = get(acquiring, ['0', 'id'], null)
    const where: AcquiringIntegrationContextWhereInput = {
        integration: { id: acquiringId },
        organization: { id: orgId },
    }
    if (status) {
        where.status = status
    }
    if (invoiceStatus) {
        where.invoiceStatus = invoiceStatus
    }

    const { obj: acquiringCtx, loading: acquiringCtxLoading, error: acquiringCtxError, refetch: refetchCtx } = AcquiringIntegrationContextApi.useObject({
        where,
    })

    return {
        loading: acquiringLoading || acquiringCtxLoading,
        error: acquiringCtxError || acquiringError,
        acquiringIntegration: get(acquiring, 0),
        acquiringIntegrationContext: acquiringCtx,
        refetchAcquiringIntegrationContext: refetchCtx,
    }
}

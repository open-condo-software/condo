import { useCreateB2BAppContextMutation, useCreateBillingIntegrationOrganizationContextMutation, useGetB2BAppContextsByOrgQuery, useGetBillingIntegrationOrganizationContextsByOrgQuery, useSoftDeleteB2BAppContextMutation, useSoftDeleteBillingContextMutation } from '@app/condo/gql'
import getConfig from 'next/config'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils'
import { useOrganization } from '@open-condo/next/organization'

import { INTEGRATION_TYPE_B2B_APP, INTEGRATION_TYPE_BILLING } from '@condo/domains/billing/constants/constants'
import { PromoAppConfig } from '@condo/domains/billing/hooks/useSelectBillingPromoBanner'

type IntegrationType = typeof INTEGRATION_TYPE_BILLING | typeof INTEGRATION_TYPE_B2B_APP


const { publicRuntimeConfig: { globalHints } } = getConfig()

type UseIntegrationContextType = {
    integrationType: IntegrationType
    integrationId: string
}

// NOTE(@abshnko): we plan on migrating BillingIntegrations to B2BApps, hence for now
// based on integrationType we return either BillingIntegrationOrganizationContext or B2BAppContext
export const useIntegrationContext = ({ integrationType, integrationId }: UseIntegrationContextType) => {
    const router = useRouter()
    const { organization } = useOrganization()
    const persistor = useCachePersistor()
    const { route } = router

    const orgId = organization?.id
    const promoB2BAppConfig: PromoAppConfig = useMemo(() => {
        return globalHints?.pages?.find(page => page?.routeTemplate === route)?.promoB2BApp || {}
    }, [route])
    const isBilling = integrationType === INTEGRATION_TYPE_BILLING
    const isB2BApp = integrationType === INTEGRATION_TYPE_B2B_APP

    const {
        data: billingContextData,
        loading: billingContextLoading,
    } = useGetBillingIntegrationOrganizationContextsByOrgQuery({
        variables: {
            organization: { id: orgId },
        },
        skip: !orgId || !integrationId || !isBilling,
        fetchPolicy: 'network-only',
    })

    const {
        data: b2bAppContextData,
        loading: b2bAppContextLoading,
    } = useGetB2BAppContextsByOrgQuery({
        variables: {
            organizationId: orgId,
        },
        skip: !orgId || !promoB2BAppConfig?.appId || !isB2BApp || !persistor,
    })

    const [createB2BAppContextMutation] = useCreateB2BAppContextMutation({
        variables: {
            data: {
                organization: { connect: { id: orgId } },
                app: { connect: { id: promoB2BAppConfig.appId } },
                dv: 1,
                sender: getClientSideSenderInfo(),
            },
        },
    })
    const [createBillingContextMutation] = useCreateBillingIntegrationOrganizationContextMutation({
        variables: {
            data: {
                organization: { connect: { id: orgId } }, 
                integration: { connect: { id: integrationId } }, 
                settings: { dv: 1 },
                state: { dv: 1 },
                dv: 1,
                sender: getClientSideSenderInfo(),
            },
        },
    })
    const [deleteBillingContextMutation] = useSoftDeleteBillingContextMutation()
    const [deleteB2BAppContextMutation] = useSoftDeleteB2BAppContextMutation()

    const billingContext = billingContextData?.contexts?.[0]
    const b2bAppContext = b2bAppContextData?.contexts?.[0]
    const ctx = isBilling ? billingContext : b2bAppContext
    const ctxLoading = isBilling ? billingContextLoading : b2bAppContextLoading
    const ctxId = ctx?.id
    const ctxIntegrationId = isBilling
        ? billingContext?.integration?.id
        : b2bAppContext?.app?.id
    const deleteMutation = isBilling ? deleteBillingContextMutation : deleteB2BAppContextMutation

    const handleSetupClick = useCallback(async () => {
        if (!ctx) {
            if (isB2BApp && promoB2BAppConfig?.appId){
                await createB2BAppContextMutation()
            }

            // TODO(@abshnko): when billngIntegration becomes b2bApp change this check to isPromo
            // to not redirect if it is promo banner
            if (isBilling){
                await createBillingContextMutation()
                router.push({ query: { step: 1, billing: integrationId } }, undefined, { shallow: true })
            }
        } else if (ctxId && integrationId !== ctxIntegrationId) {
            await deleteMutation({
                variables: {
                    id: ctxId,
                    deletedAt: new Date().toISOString(),
                    sender: getClientSideSenderInfo(),
                },
            })
            if (isBilling) {
                await createBillingContextMutation()
                router.push({ query: { step: 1, billing: integrationId } }, undefined, { shallow: true })
            }
            if (isB2BApp) {
                await createB2BAppContextMutation()
            }

        } else {
            if (isBilling) {
                router.push({ query: { step: 1, billing: integrationId } }, undefined, { shallow: true })
            }
        }
    }, [ctx, ctxId, integrationId, ctxIntegrationId, isB2BApp, promoB2BAppConfig?.appId, isBilling, createB2BAppContextMutation, createBillingContextMutation, router, deleteMutation])

    return {
        context: ctx,
        loading: ctxLoading,
        handleSetupClick,
    }
}
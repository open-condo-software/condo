import { useCallback, useMemo, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'


type UseIntegrationContextsType = {
    integrationIds: string[]
}

export const useIntegrationContexts = ({ integrationIds }: UseIntegrationContextsType) => {
    const { organization } = useOrganization()
    const orgId = organization?.id

    const [actionLoading, setActionLoading] = useState(false)

    const { objs: contexts, loading: contextsLoading } = AcquiringIntegrationContext.useObjects({
        where: {
            organization: { id: orgId },
        },
    })

    const createContextAction = AcquiringIntegrationContext.useCreate({
        settings: { dv: 1 },
        state: { dv: 1 },
    })
    const deleteContextAction = AcquiringIntegrationContext.useSoftDelete()

    const selectedIntegrationIds = useMemo(() => integrationIds.filter(Boolean), [integrationIds])

    const handleSetupClick = useCallback(async () => {
        if (!orgId) return

        setActionLoading(true)
        try {
            const existingContextsByIntegrationId = new Map(
                contexts
                    .filter(({ integration }) => Boolean(integration?.id))
                    .map((context) => [context.integration.id, context])
            )

            const selectedIdsSet = new Set(selectedIntegrationIds)
            const contextsToDelete = contexts.filter((context) => {
                const contextIntegrationId = context.integration?.id
                return contextIntegrationId && !selectedIdsSet.has(contextIntegrationId)
            })
            const integrationIdsToCreate = selectedIntegrationIds.filter((integrationId) => {
                return !existingContextsByIntegrationId.has(integrationId)
            })

            for (const context of contextsToDelete) {
                await deleteContextAction({ id: context.id })
            }

            for (const integrationId of integrationIdsToCreate) {
                await createContextAction({
                    organization: { connect: { id: orgId } },
                    integration: { connect: { id: integrationId } },
                })
            }
        } finally {
            setActionLoading(false)
        }
    }, [contexts, createContextAction, deleteContextAction, orgId, selectedIntegrationIds])

    return {
        contexts,
        loading: contextsLoading || actionLoading,
        handleSetupClick,
    }
}

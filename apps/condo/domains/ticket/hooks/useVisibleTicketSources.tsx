import { useCheckTicketExistenceWithSourceAndOrganizationLazyQuery, useGetTicketSourcesQuery } from '@app/condo/gql'
import { useMemo, useState, useCallback } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { VISIBLE_TICKET_SOURCE_IDS } from '@condo/domains/ticket/constants/sources'


const VISIBLE_CUSTOM_SOURCE_IDS_BY_ORGANIZATION_ID = {}

export const useVisibleTicketSources = ({ organizationIds, key }: { organizationIds: Array<string>, key: string }) => {
    const { persistor } = useCachePersistor()

    const { data: sourcesData } = useGetTicketSourcesQuery({
        skip: !persistor,
    })
    
    const [checkTicketExistenceWithSourceAndOrganization] = useCheckTicketExistenceWithSourceAndOrganizationLazyQuery()
    const customSourceIds = useMemo(
        () => sourcesData?.sources?.filter(Boolean)
            ?.filter(source => !source.isDefault)
            ?.map(source => source.id) || [],
        [sourcesData]
    )
    const [visibleCustomSourceIds, setVisibleCustomSourceIds] = useState<Array<string>>([])
    const loadVisibleCustomTicketSources = useCallback(async (customSourceIds: Array<string>, organizationIds: Array<string>, key: string) => {
        const visibleCustomSourcesForCurrentOrganization = VISIBLE_CUSTOM_SOURCE_IDS_BY_ORGANIZATION_ID[key]
        if (Array.isArray(visibleCustomSourcesForCurrentOrganization)) {
            return visibleCustomSourcesForCurrentOrganization
        }

        const hasTicketsBySource = customSourceIds.reduce((acc, currentValue) => {
            acc[currentValue] = false
            return acc
        }, {})

        for (const sourceId of customSourceIds) {
            const res = await checkTicketExistenceWithSourceAndOrganization({
                variables: {
                    organizationIds,
                    sourceId,
                },
            })

            if (res?.data?.tickets?.length > 0) {
                hasTicketsBySource[sourceId] = true
            }
        }

        const visibleCustomSources = Object.entries(hasTicketsBySource)
            .filter(([_, hasTickets]) => hasTickets)
            .map(([sourceId]) => sourceId)

        VISIBLE_CUSTOM_SOURCE_IDS_BY_ORGANIZATION_ID[key] = visibleCustomSources

        return visibleCustomSources
    }, [checkTicketExistenceWithSourceAndOrganization])

    const getVisibleCustomTicketSources = useCallback(async (customSourceIds: Array<string>, organizationIds: Array<string>, key: string) => {
        const visibleSourceIds = await loadVisibleCustomTicketSources(customSourceIds, organizationIds, key)
        setVisibleCustomSourceIds(visibleSourceIds || [])
    }, [loadVisibleCustomTicketSources])

    useDeepCompareEffect(() => {
        if (!organizationIds) return
        if (customSourceIds.length < 1) return
        if (!key) return

        getVisibleCustomTicketSources(customSourceIds, organizationIds, key)
    }, [customSourceIds, organizationIds, key])

    const visibleSources = useMemo(
        () => sourcesData?.sources?.filter(Boolean)
            ?.filter((source) => {
                return VISIBLE_TICKET_SOURCE_IDS.includes(source.id) || visibleCustomSourceIds.includes(source.id)
            }) || [],
        [sourcesData?.sources, visibleCustomSourceIds]
    )

    return useMemo(() => ({ visibleSources }), [visibleSources])
}

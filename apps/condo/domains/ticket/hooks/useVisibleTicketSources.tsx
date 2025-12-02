import intersection from 'lodash/intersection'
import uniq from 'lodash/uniq'
import { useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { EXTRA_TICKET_SOURCES_TO_ORGANIZATIONS } from '@condo/domains/common/constants/featureflags'
import { VISIBLE_TICKET_SOURCE_IDS } from '@condo/domains/ticket/constants/sources'


export const useVisibleTicketSources = (organizationIdsOrIdToCheck: string | Array<string> = []): { visibleTicketSourceIds: Array<string> } => {
    const { useFlagValue } = useFeatureFlags()
    const extraTicketSourcesToOrganizationIds = useFlagValue<{ [ticketSourceId: string]: Array<string> }>(EXTRA_TICKET_SOURCES_TO_ORGANIZATIONS)

    const visibleTicketSourceIds: Array<string> = useMemo(() => {
        const organizationIdsToCheck: Array<string> = []
        if (Array.isArray(organizationIdsOrIdToCheck)) {
            organizationIdsToCheck.push(...organizationIdsOrIdToCheck)
        } else if (typeof organizationIdsOrIdToCheck === 'string') {
            organizationIdsToCheck.push(organizationIdsOrIdToCheck)
        }

        const extraTicketSourceIds: Array<string> = []

        try {
            if (!!extraTicketSourcesToOrganizationIds && typeof extraTicketSourcesToOrganizationIds === 'object' && organizationIdsToCheck.length > 0) {
                Object.entries(extraTicketSourcesToOrganizationIds).forEach(([ticketSourceId, organizationIds]) => {
                    const sourceIsInAtLeastOneOfRelatedOrganizations = Array.isArray(organizationIds) && intersection(organizationIds, organizationIdsToCheck).length > 0
                    if (typeof ticketSourceId === 'string' && sourceIsInAtLeastOneOfRelatedOrganizations) {
                        extraTicketSourceIds.push(ticketSourceId)
                    }
                })
            }
        } catch (error) {
            console.log('Cannot processed extraTicketSourceIds!')
            console.error(error)
        }
        console.log({
            organizationIdsToCheck,
            organizationIdsOrIdToCheck,
            extraTicketSourceIds,
        })

        return [...VISIBLE_TICKET_SOURCE_IDS, ...uniq(extraTicketSourceIds)]
    }, [extraTicketSourcesToOrganizationIds, organizationIdsOrIdToCheck])

    return useMemo(() => ({ visibleTicketSourceIds }), [visibleTicketSourceIds])
}
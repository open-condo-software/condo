import {
    useCheckTicketExistenceWithSourceAndOrganizationLazyQuery,
    useCheckTicketChangesExistenceByTicketIdLazyQuery,
    useCheckTicketCommentsExistenceLazyQuery,
} from '@app/condo/gql'
import { UserTypeType } from '@app/condo/schema'
import dayjs, { ConfigType, Dayjs } from 'dayjs'
import { useCallback, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { SUPERVISED_TICKET_SOURCE } from '@condo/domains/common/constants/featureflags'


class LocalStorageManager {
    private static MANAGER_NAME = 'supervised-tickets'
    static CACHE_TTL_IN_MIN = 15

    private static getKey (organizationId: string): string {
        return `${this.MANAGER_NAME}-${organizationId}`
    }

    static setHasSupervisedTicketsInOrganization (organizationId: string, hasEscalatedTickets: boolean): void {
        if (!organizationId) return

        localStorage.setItem(this.getKey(organizationId), JSON.stringify({
            createdAt: new Date().toISOString(),
            value: hasEscalatedTickets || false,
        }))
    }

    static getHasSupervisedTicketsInOrganization (organizationId: string): { createdAt: string, value: boolean } {
        if (!organizationId) return null

        const item = localStorage.getItem(this.getKey(organizationId))
        if (!item) return null

        try {
            const parsedItem = JSON.parse(item)

            return {
                createdAt: parsedItem?.createdAt,
                value: parsedItem?.value,
            }
        } catch (error) {
            console.log('LocalStorageManager:getHasSupervisedTicketsInOrganization', {
                error,
            })
            return null
        }
    }

    static deleteHasSupervisedTicketsInOrganization (organizationId: string): void {
        if (!organizationId) return

        localStorage.removeItem(this.getKey(organizationId))
    }
}

function addWorkDays (startDate: ConfigType, days: number): Dayjs {
    let date = dayjs(startDate)
    let added = 0

    while (added < days) {
        date = date.add(1, 'day')

        const day = date.day()
        // 0 — Sunday, 6 — Saturday
        if (day !== 0 && day !== 6) {
            added++
        }
    }

    return date
}

export const useSupervisedTickets = () => {
    const { useFlagValue } = useFeatureFlags()

    const supervisedTicketSourceIdFromFeatureFlag = useFlagValue<string>(SUPERVISED_TICKET_SOURCE)
    const supervisedTicketSourceId = useMemo(() => {
        if (!supervisedTicketSourceIdFromFeatureFlag) return null
        if (typeof supervisedTicketSourceIdFromFeatureFlag !== 'string') return null
        return supervisedTicketSourceIdFromFeatureFlag
    }, [supervisedTicketSourceIdFromFeatureFlag])

    const isSupervisedTicketSource = useCallback((sourceId: string) => {
        return supervisedTicketSourceId && sourceId && supervisedTicketSourceId === sourceId
    }, [supervisedTicketSourceId])

    const [checkTicketExistenceWithSourceAndOrganization] = useCheckTicketExistenceWithSourceAndOrganizationLazyQuery()
    const [checkTicketChangesExistenceByTicketId] = useCheckTicketChangesExistenceByTicketIdLazyQuery()
    const [checkTicketCommentsExistence] = useCheckTicketCommentsExistenceLazyQuery()

    const hasSupervisedTicketsInOrganization = useCallback(async (organizationId: string, relatedOrganizationIds?: Array<string>) => {
        if (!supervisedTicketSourceId) return false
        if (!organizationId || typeof organizationId !== 'string') return false
        if (relatedOrganizationIds && (!Array.isArray(relatedOrganizationIds) || relatedOrganizationIds.length < 1)) return false

        // NOTE: Tickets ttl in Apollo is 1 minute. It is very short.
        // Because we use custom logic to cache this check.
        const cachedResult = LocalStorageManager.getHasSupervisedTicketsInOrganization(organizationId)
        if (cachedResult) {
            const cachedResultIsExpired = dayjs(cachedResult.createdAt)
                .add(LocalStorageManager.CACHE_TTL_IN_MIN, 'minutes')
                .diff(dayjs()) < 0
            const isValidCachedResult = cachedResult.createdAt && dayjs(cachedResult.createdAt).isValid() && !cachedResultIsExpired
                && typeof cachedResult.value === 'boolean'

            if (isValidCachedResult) return cachedResult.value
        }

        LocalStorageManager.deleteHasSupervisedTicketsInOrganization(organizationId)

        const organizationIdsForSearch = relatedOrganizationIds ? relatedOrganizationIds : [organizationId]

        const res = await checkTicketExistenceWithSourceAndOrganization({
            variables: {
                organizationIds: organizationIdsForSearch,
                sourceId: supervisedTicketSourceId,
            },
        })

        const hasTickets = res?.data?.tickets?.length > 0
        LocalStorageManager.setHasSupervisedTicketsInOrganization(organizationId, hasTickets)

        return hasTickets
    }, [supervisedTicketSourceId])

    const shouldShowTicketEscalationWarning = useCallback(async (ticket) => {
        if (!ticket || !ticket?.id || typeof ticket?.id !== 'string') return false
        if (!isSupervisedTicketSource(ticket?.source?.id)) return false
        if (ticket?.sentToAuthoritiesAt) return false

        if (ticket?.statusUpdatedAt) return false

        const ticketChangesExistenceRes = await checkTicketChangesExistenceByTicketId({
            variables: {
                ticketId: ticket?.id,
            },
        })
        const hasTicketChanges = ticketChangesExistenceRes?.data?.ticketChanges?.length > 0
        if (hasTicketChanges) {
            return false
        }

        const ticketCommentsExistenceRes = await checkTicketCommentsExistence({
            variables: {
                where: {
                    ticket: { id: ticket?.id },
                    createdBy: { type_not: UserTypeType.Resident },
                },
            },
        })
        const hasTicketComments = ticketCommentsExistenceRes?.data?.ticketComments?.length > 0
        if (hasTicketComments) {
            return false
        }

        return true
    }, [isSupervisedTicketSource])

    const calculateDeadlineToEscalationTicket = useCallback((ticket, workDays = 3) => {
        if (!ticket?.createdAt) return null

        return addWorkDays(dayjs(ticket?.createdAt), workDays)
    }, [])

    return {
        supervisedTicketSourceId,
        isSupervisedTicketSource,
        hasSupervisedTicketsInOrganization,
        shouldShowTicketEscalationWarning,
        calculateDeadlineToEscalationTicket,
    }
}

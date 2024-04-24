import { SortTicketCommentsBy } from '@app/condo/schema'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
import { useCallback, useEffect, useRef } from 'react'

import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'
import { useExecuteWithLock } from '@condo/domains/common/hooks/useExecuteWithLock'
import { TicketComment } from '@condo/domains/ticket/utils/clientSchema'


const COMMENT_RE_FETCH_INTERVAL_IN_MS = 5 * 1000
const LOCK_NAME = 'ticketComments'
const BROADCAST_CHANNEL_NAME = 'ticketComments'
const LOCAL_STORAGE_SYNC_KEY = 'syncTicketCommentsAt'

export function usePollTicketComments ({
    ticket,
    refetchTicketComments,
}) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>()

    const { refetch: refetchSyncComments } = TicketComment.useObjects({}, { skip: true })

    const { sendMessage } = useBroadcastChannel<string[]>(BROADCAST_CHANNEL_NAME, async (ticketIdsWithUpdatedComments) => {
        if (ticketIdsWithUpdatedComments.includes(get(ticket, 'id'))) {
            await refetchTicketComments()
        }
    })

    const pollTicketComments = useCallback(async () => {
        if (!localStorage) return

        const lastSyncAt = localStorage.getItem(LOCAL_STORAGE_SYNC_KEY)
        const updatedAtStatement = lastSyncAt ? { updatedAt_gt: lastSyncAt } : {}

        const result = await refetchSyncComments({
            where: {
                ticket: { organization: { id: get(ticket, 'organization.id', null) } },
                ...updatedAtStatement,
            },
            sortBy: [SortTicketCommentsBy.UpdatedAtDesc],
        })
        const ticketComments = get(result, 'data.objs', [])

        const newSyncedAt = get(ticketComments, '0.updatedAt', new Date().toISOString())
        localStorage.setItem(LOCAL_STORAGE_SYNC_KEY, newSyncedAt)

        const ticketsWithUpdatedComments: string[] = uniq(ticketComments.map(ticketComment => get(ticketComment, 'ticket.id')))

        sendMessage(ticketsWithUpdatedComments)
    }, [refetchSyncComments, sendMessage, ticket])

    const { releaseLock } = useExecuteWithLock(LOCK_NAME, () => {
        intervalRef.current = setInterval(pollTicketComments, COMMENT_RE_FETCH_INTERVAL_IN_MS)
    })

    useEffect(() => {
        return () => {
            if (releaseLock) {
                return releaseLock()
            }
        }
    }, [releaseLock])

    useEffect(() => {
        return () => {
            clearInterval(intervalRef.current)
        }
    }, [])
}
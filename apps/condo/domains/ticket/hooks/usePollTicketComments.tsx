import { useGetPollTicketCommentsQuery } from '@app/condo/gql'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
import { useCallback, useEffect, useRef } from 'react'

import { useBroadcastChannel } from '@condo/domains/common/hooks/useBroadcastChannel'
import { useExecuteWithLock } from '@condo/domains/common/hooks/useExecuteWithLock'


const COMMENT_RE_FETCH_INTERVAL_IN_MS = 15 * 1000
const LOCK_NAME = 'ticketComments'
const BROADCAST_CHANNEL_NAME = 'ticketComments'
const LOCAL_STORAGE_SYNC_KEY = 'syncTicketCommentsAt'

export function usePollTicketComments ({
    ticket,
    refetchTicketComments,
    pollCommentsQuery,
}) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>()

    const { refetch: refetchSyncComments } = useGetPollTicketCommentsQuery({
        skip: true,
    })

    const { sendMessage } = useBroadcastChannel<string[]>(BROADCAST_CHANNEL_NAME, async (ticketIdsWithUpdatedComments) => {
        if (ticketIdsWithUpdatedComments.includes(get(ticket, 'id'))) {
            await refetchTicketComments()
        }
    })

    const pollTicketComments = useCallback(async () => {
        if (!localStorage) return

        const now = new Date().toISOString()
        const lastSyncAt = localStorage.getItem(LOCAL_STORAGE_SYNC_KEY)

        const result = await refetchSyncComments({
            where: {
                ...pollCommentsQuery,
                updatedAt_gt: lastSyncAt || now,
            },
        })
        const ticketComments = result?.data?.ticketComments?.filter(Boolean) || []

        const newSyncedAt = get(ticketComments, '0.updatedAt', now)
        localStorage.setItem(LOCAL_STORAGE_SYNC_KEY, newSyncedAt)

        const ticketsWithUpdatedComments: string[] = uniq(ticketComments.map(ticketComment => get(ticketComment, 'ticket.id')))

        sendMessage(ticketsWithUpdatedComments)
    }, [pollCommentsQuery, refetchSyncComments, sendMessage])

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
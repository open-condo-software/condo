import { useGetPollTicketCommentsQuery } from '@app/condo/gql'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import uniq from 'lodash/uniq'
import { useCallback, useEffect, useRef } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'
import { isSSR } from '@open-condo/miniapp-utils'

import { POLL_TICKET_COMMENTS } from '@condo/domains/common/constants/featureflags'
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
    const { useFlag } = useFeatureFlags()
    const isPollTicketCommentsEnabled = useFlag(POLL_TICKET_COMMENTS)
    const pollTicketCommentsEnabledRef = useRef<boolean>(isPollTicketCommentsEnabled)
    useEffect(() => {
        pollTicketCommentsEnabledRef.current = isPollTicketCommentsEnabled
    }, [isPollTicketCommentsEnabled])
    
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>()

    const { refetch: refetchSyncComments } = useGetPollTicketCommentsQuery({
        skip: true,
    })

    const {
        sendMessageToBroadcastChannel,
    } = useBroadcastChannel<string[]>(BROADCAST_CHANNEL_NAME, async (ticketIdsWithUpdatedComments) => {
        if (ticketIdsWithUpdatedComments.includes(get(ticket, 'id'))) {
            await refetchTicketComments()
        }
    })

    const pollTicketComments = useCallback(async () => {
        if (isSSR() || !localStorage || !pollTicketCommentsEnabledRef.current) return

        const now = new Date().toISOString()
        const lastSyncAt = localStorage.getItem(LOCAL_STORAGE_SYNC_KEY)
        localStorage.setItem(LOCAL_STORAGE_SYNC_KEY, now)

        const result = await refetchSyncComments({
            where: {
                ...pollCommentsQuery,
                updatedAt_gt: lastSyncAt || now,
            },
            first: 100,
        })
        const ticketComments = result?.data?.ticketComments?.filter(Boolean) || []

        const ticketsWithUpdatedComments: string[] = uniq(ticketComments.map(
            ticketComment => ticketComment?.ticket?.id
        ))

        if (!isEmpty(ticketsWithUpdatedComments)) {
            sendMessageToBroadcastChannel(ticketsWithUpdatedComments)
        }
    }, [pollCommentsQuery, refetchSyncComments, sendMessageToBroadcastChannel])

    useExecuteWithLock(LOCK_NAME, () => {
        intervalRef.current = setInterval(pollTicketComments, COMMENT_RE_FETCH_INTERVAL_IN_MS)
    })

    useEffect(() => {
        return () => {
            clearInterval(intervalRef.current)
        }
    }, [])
}
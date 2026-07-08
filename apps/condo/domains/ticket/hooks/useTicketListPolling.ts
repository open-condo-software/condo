import { useGetLatestTicketUpdatedAtLazyQuery } from '@app/condo/gql'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAutoRefetchTickets } from '@condo/domains/ticket/contexts/AutoRefetchTicketsContext'


interface UseTicketListPollingOptions {
    baseTicketsQuery: Record<string, unknown>
    onFullRefetch: () => Promise<void>
    onEveryTick?: () => Promise<void>
}

export function useTicketListPolling ({
    baseTicketsQuery,
    onFullRefetch,
    onEveryTick,
}: UseTicketListPollingOptions): { isRefetching: boolean } {
    const { refetchInterval } = useAutoRefetchTickets()
    const [isRefetching, setIsRefetching] = useState(false)

    const lastUpdatedAt = useRef<string | null>(null)
    const shouldRefetchOnFocusRef = useRef(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const onFullRefetchRef = useRef(onFullRefetch)
    useEffect(() => { onFullRefetchRef.current = onFullRefetch }, [onFullRefetch])
    const onEveryTickRef = useRef(onEveryTick)
    useEffect(() => { onEveryTickRef.current = onEveryTick }, [onEveryTick])

    const [fetchLatestUpdatedAt] = useGetLatestTicketUpdatedAtLazyQuery({ fetchPolicy: 'network-only' })

    const runRefetch = useCallback(async () => {
        if (lastUpdatedAt.current !== null) {
            const { data } = await fetchLatestUpdatedAt({
                variables: { where: { ...baseTicketsQuery, updatedAt_gt: lastUpdatedAt.current } },
            })
            const latestTicket = data?.tickets?.[0]
            if (!latestTicket) return

            lastUpdatedAt.current = latestTicket.updatedAt
        }

        setIsRefetching(true)
        await onFullRefetchRef.current()
        setIsRefetching(false)

        if (lastUpdatedAt.current === null) {
            const { data } = await fetchLatestUpdatedAt({
                variables: { where: baseTicketsQuery },
            })
            lastUpdatedAt.current = data?.tickets?.[0]?.updatedAt ?? null
        }
    }, [baseTicketsQuery, fetchLatestUpdatedAt])

    useEffect(() => {
        const scheduleNext = () => {
            timerRef.current = setTimeout(async () => {
                if (document.hidden) {
                    shouldRefetchOnFocusRef.current = true
                } else {
                    await runRefetch()
                    shouldRefetchOnFocusRef.current = false
                }

                await onEveryTickRef.current?.()

                scheduleNext()
            }, refetchInterval)
        }

        const onVisibilityChange = async () => {
            if (!document.hidden && shouldRefetchOnFocusRef.current) {
                await runRefetch()
                shouldRefetchOnFocusRef.current = false

                if (timerRef.current) clearTimeout(timerRef.current)
                scheduleNext()
            }
        }

        scheduleNext()
        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [runRefetch, refetchInterval])

    return { isRefetching }
}

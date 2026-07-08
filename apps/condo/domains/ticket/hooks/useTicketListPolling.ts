import { useGetLatestTicketUpdatedAtLazyQuery } from '@app/condo/gql'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useAutoRefetchTickets } from '@condo/domains/ticket/contexts/AutoRefetchTicketsContext'


const LAST_UPDATED_AT_STORAGE_KEY = 'condo:ticket:lastUpdatedAt'

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

    const lastUpdatedAt = useRef<string | null>(
        typeof window !== 'undefined' ? localStorage.getItem(LAST_UPDATED_AT_STORAGE_KEY) : null
    )
    const shouldRefetchOnFocusRef = useRef(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const onFullRefetchRef = useRef(onFullRefetch)
    useEffect(() => { onFullRefetchRef.current = onFullRefetch }, [onFullRefetch])
    const onEveryTickRef = useRef(onEveryTick)
    useEffect(() => { onEveryTickRef.current = onEveryTick }, [onEveryTick])

    const [fetchLatestUpdatedAt] = useGetLatestTicketUpdatedAtLazyQuery({ fetchPolicy: 'network-only' })

    const setLastUpdatedAt = useCallback((value: string | null) => {
        lastUpdatedAt.current = value
        if (value) {
            localStorage.setItem(LAST_UPDATED_AT_STORAGE_KEY, value)
        } else {
            localStorage.removeItem(LAST_UPDATED_AT_STORAGE_KEY)
        }
    }, [])

    const runRefetch = useCallback(async () => {
        if (lastUpdatedAt.current !== null) {
            const { data } = await fetchLatestUpdatedAt({
                variables: { where: { ...baseTicketsQuery, updatedAt_gt: lastUpdatedAt.current } },
            })
            const latestTicket = data?.tickets?.[0]
            if (!latestTicket) return

            setLastUpdatedAt(latestTicket.updatedAt)
        }

        setIsRefetching(true)
        await onFullRefetchRef.current()
        setIsRefetching(false)

        if (lastUpdatedAt.current === null) {
            const { data } = await fetchLatestUpdatedAt({
                variables: { where: baseTicketsQuery },
            })
            setLastUpdatedAt(data?.tickets?.[0]?.updatedAt ?? null)
        }
    }, [baseTicketsQuery, fetchLatestUpdatedAt, setLastUpdatedAt])

    useEffect(() => {
        const scheduleNext = () => {
            timerRef.current = setTimeout(async () => {
                try {
                    if (document.hidden) {
                        shouldRefetchOnFocusRef.current = true
                    } else {
                        await runRefetch()
                        shouldRefetchOnFocusRef.current = false
                    }
                    await onEveryTickRef.current?.()
                } finally {
                    scheduleNext()
                }
            }, refetchInterval)
        }

        const onVisibilityChange = async () => {
            if (!document.hidden && shouldRefetchOnFocusRef.current) {
                if (timerRef.current) clearTimeout(timerRef.current)
                timerRef.current = null
                await runRefetch()
                shouldRefetchOnFocusRef.current = false
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

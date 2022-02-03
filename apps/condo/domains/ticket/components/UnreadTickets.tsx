import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useLazyQuery, useMutation } from '@apollo/client'
import { useAuth } from '@core/next/auth'
import { Ticket, TicketLastTimeViewedRecord } from '@condo/domains/ticket/gql'

type UnreadTicketsCounterContext = {
    numberOfUnreadTickets: number
    syncWithServer: (d: string) => void
}
const UnreadTicketsCounterContext = createContext<UnreadTicketsCounterContext>({ 
    numberOfUnreadTickets: 0,
    syncWithServer: void 0,
})

const TICKETS_UPDATE_DELAY = 2000

export const UnreadTicketsSyncProvider: React.FC = ({ children }) => {
    const { isAuthenticated, user } = useAuth()
    const [numberOfUnreadTickets, setNumberOfUnreadTickets] = useState(0)
    const lastTimeTicketsViewed = useRef(0)

    const [updateTicketLastTimeViewedRecordMutation] = useMutation(TicketLastTimeViewedRecord.UPDATE_OBJ_MUTATION)
    
    const { startPolling, stopPolling } = useQuery(Ticket.GET_COUNT_OBJS_QUERY, {
        variables: {
            where: {
                createdAt_gt: new Date(lastTimeTicketsViewed.current).toISOString(),
            },
        },
        onCompleted: ({ meta : { count } }) => {
            setNumberOfUnreadTickets(count)
        },
        fetchPolicy: 'no-cache',
        notifyOnNetworkStatusChange: true,
    })

    const [getTicketLastTimeViewedRecord] = useLazyQuery(TicketLastTimeViewedRecord.GET_ALL_OBJS_QUERY, {
        onCompleted: (data) => {
            const { objs: [{ lastTimeViewed }] } = data
            lastTimeTicketsViewed.current = lastTimeViewed
            startPolling(TICKETS_UPDATE_DELAY)
        },
    })

    const syncWithServer = useCallback((_lastTimeTicketsViewed)=> {
        if (!isAuthenticated || !user) return
        lastTimeTicketsViewed.current = _lastTimeTicketsViewed
        updateTicketLastTimeViewedRecordMutation({
            variables: {
                id: user.id,
                data: {
                    lastTimeViewed: lastTimeTicketsViewed.current,
                },
            },
        })
    }, [user, isAuthenticated, updateTicketLastTimeViewedRecordMutation])

    const unreadTicketsCounterContextValue = useMemo(() => ({
        numberOfUnreadTickets,
        syncWithServer, 
    }), [numberOfUnreadTickets, syncWithServer])

    useEffect(() => {
        if (!isAuthenticated) return
        getTicketLastTimeViewedRecord()
        return () => stopPolling()
    }, [getTicketLastTimeViewedRecord, isAuthenticated, stopPolling])

    return (
        <UnreadTicketsCounterContext.Provider 
            value={unreadTicketsCounterContextValue}>
            {children}
        </UnreadTicketsCounterContext.Provider>)
}

export const useTicketsCounter = () => useContext(UnreadTicketsCounterContext)
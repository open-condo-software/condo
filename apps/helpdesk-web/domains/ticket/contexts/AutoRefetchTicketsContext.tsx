import React, { createContext, useContext } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { RE_FETCH_TICKETS_IN_CONTROL_ROOM } from '@condo/domains/common/constants/featureflags'

interface IAutoRefetchTicketsContext {
    isRefetchTicketsFeatureEnabled: boolean
    refetchInterval: number
}

const TICKETS_RE_FETCH_INTERVAL = 60 * 1000

const AutoRefetchTicketsContext = createContext<IAutoRefetchTicketsContext>({
    isRefetchTicketsFeatureEnabled: false,
    refetchInterval: TICKETS_RE_FETCH_INTERVAL,
})

const useAutoRefetchTickets = (): IAutoRefetchTicketsContext => useContext(AutoRefetchTicketsContext)

const AutoRefetchTicketsContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { useFlag } = useFeatureFlags()

    const isRefetchTicketsFeatureEnabled = useFlag(RE_FETCH_TICKETS_IN_CONTROL_ROOM)

    return (
        <AutoRefetchTicketsContext.Provider
            value={{
                isRefetchTicketsFeatureEnabled,
                refetchInterval: TICKETS_RE_FETCH_INTERVAL,
            }}
        >
            {children}
        </AutoRefetchTicketsContext.Provider>
    )
}

export { useAutoRefetchTickets, AutoRefetchTicketsContextProvider }
import React, { createContext, useContext, useMemo } from 'react'

import { useFeatureFlags } from '@open-condo/featureflags/FeatureFlagsContext'

import { REFETCH_TICKETS_INTERVAL_IN_SECONDS } from '@condo/domains/common/constants/featureflags'

interface IAutoRefetchTicketsContext {
    refetchInterval: number
}

const DEFAULT_REFETCH_INTERVAL_IN_SECONDS = 60

const AutoRefetchTicketsContext = createContext<IAutoRefetchTicketsContext>({
    refetchInterval: DEFAULT_REFETCH_INTERVAL_IN_SECONDS * 1000,
})

const useAutoRefetchTickets = (): IAutoRefetchTicketsContext => useContext(AutoRefetchTicketsContext)

const AutoRefetchTicketsContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const { useFlagValue } = useFeatureFlags()

    const refetchIntervalFlagValue = useFlagValue<number>(REFETCH_TICKETS_INTERVAL_IN_SECONDS)

    const refetchInterval = useMemo(() => {
        const intervalInSeconds = Number(refetchIntervalFlagValue)
        return (Number.isFinite(intervalInSeconds) && intervalInSeconds > 60
            ? intervalInSeconds
            : DEFAULT_REFETCH_INTERVAL_IN_SECONDS) * 1000
    }, [refetchIntervalFlagValue])

    const value = useMemo(() => ({ refetchInterval }), [refetchInterval])

    return (
        <AutoRefetchTicketsContext.Provider value={value}>
            {children}
        </AutoRefetchTicketsContext.Provider>
    )
}

export { useAutoRefetchTickets, AutoRefetchTicketsContextProvider }

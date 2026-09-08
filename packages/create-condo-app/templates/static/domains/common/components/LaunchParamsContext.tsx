import React, { useEffect, useMemo, useState } from 'react'

import bridge from '@open-condo/bridge'
import type { GetLaunchParamsData } from '@open-condo/bridge'

type LaunchParamsContextType = {
    loading: boolean
    launchParams: GetLaunchParamsData | null
}

const LaunchParamsContext = React.createContext<LaunchParamsContextType>({
    loading: true,
    launchParams: null,
})

export const LaunchParamsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [launchParams, setLaunchParams] = useState<GetLaunchParamsData | null>(null)

    useEffect(() => {
        bridge.send('CondoWebAppGetLaunchParams').then((data) => {
            setIsLoading(false)
            setLaunchParams(data)
        }).catch(() => {
            setIsLoading(false)
        })
    }, [])

    const contextValue = useMemo(() => ({
        loading: isLoading,
        launchParams,
    }), [isLoading, launchParams])

    return (
        <LaunchParamsContext.Provider value={contextValue}>
            {children}
        </LaunchParamsContext.Provider>
    )
}
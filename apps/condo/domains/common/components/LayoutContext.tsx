import React, { createContext, useContext, useEffect, useState } from 'react'

import { ScreenMap, useBreakpoints } from '@open-condo/ui/dist/hooks'

import { ITopNotification, useTopNotificationsHook } from './TopNotifications'

interface ILayoutContext {
    isMobile?: boolean
    shouldTableScroll?: boolean
    breakpoints?: ScreenMap
    isCollapsed?: boolean
    toggleCollapsed?: () => void
    addNotification?: (notification: ITopNotification) => void
    removeNotification?: (notificationId: string) => void
}

const isMobileUserAgent = (): boolean => {
    return (
        typeof window !== 'undefined'
        && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent)
    )
}

const LayoutContext = createContext<ILayoutContext>({})

export const useLayoutContext = (): ILayoutContext => useContext<ILayoutContext>(LayoutContext)

type LayoutContextProviderProps = {
    children: React.ReactNode
    serviceProblemsAlert?: React.ReactNode
}

export const LayoutContextProvider: React.FC<LayoutContextProviderProps> = (props) => {
    const breakpoints = useBreakpoints()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const {
        TopNotificationComponent,
        addNotification,
        removeNotification,
    } = useTopNotificationsHook(props.serviceProblemsAlert)

    const toggleCollapsed = () => {
        localStorage && localStorage.setItem('isCollapsed', String(!isCollapsed))
        setIsCollapsed(!isCollapsed)
    }

    const shouldTableScroll = !breakpoints.DESKTOP_LARGE

    useEffect(() => {
        const isCollapsed = localStorage.getItem('isCollapsed') === 'true'

        setIsCollapsed(isCollapsed)
    }, [])

    return (
        <LayoutContext.Provider value={{
            isMobile: isMobileUserAgent(),
            shouldTableScroll,
            breakpoints,
            isCollapsed,
            toggleCollapsed,
            addNotification,
            removeNotification,
        }}>
            <TopNotificationComponent/>
            {props.children}
        </ LayoutContext.Provider>
    )
}
import React, { createContext, useContext, useEffect, useState } from 'react'

import { ScreenMap, useBreakpoints } from '@open-condo/ui/dist/hooks'

import { ITopNotification, useTopNotificationsHook } from './TopNotifications'


interface ILayoutContext {
    /**
     * A static value based on "userAgent". Work for CSR only
     */
    isMobile?: boolean
    /**
     * A dynamic value based on "userAgent" (for SSR) and "breakpoints" (for CSR)
     */
    isMobileView?: boolean
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
    detectedMobileUserAgentInSSR?: boolean
}

export const LayoutContextProvider: React.FC<LayoutContextProviderProps> = (props) => {
    const { detectedMobileUserAgentInSSR = false } = props
    const breakpoints = useBreakpoints()
    const [isCollapsed, setIsCollapsed] = useState(detectedMobileUserAgentInSSR)

    // NOTE: On the first render, the breakpoint returns default values, which may be incorrect.
    const [breakpointsReady, setBreakpointsReady] = useState(false)
    const [isMobileView, setIsMobileView] = useState(detectedMobileUserAgentInSSR)
    useEffect(() => {
        if (!breakpointsReady) {
            setBreakpointsReady(true)
            return
        }
        setIsMobileView(!breakpoints?.TABLET_LARGE)
    }, [breakpoints?.TABLET_LARGE, breakpointsReady])

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
        if (detectedMobileUserAgentInSSR) {
            localStorage.setItem('isCollapsed', 'true')
        }
        const isCollapsed = localStorage.getItem('isCollapsed') === 'true'

        setIsCollapsed(isCollapsed)
    }, [])

    return (
        <LayoutContext.Provider value={{
            isMobile: isMobileUserAgent(),
            isMobileView,
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
import { setCookie } from 'cookies-next'
import React, { createContext, useContext, useLayoutEffect, useState } from 'react'

import { ScreenMap, useBreakpoints } from '@open-condo/ui/dist/hooks'

import { IS_SIDEBAR_COLLAPSED_COOKIE_NAME } from '@condo/domains/common/utils/next/ssr'

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


const YEAR_IN_SECONDS = 60 * 60 * 24 * 365

const LayoutContext = createContext<ILayoutContext>({})

export const useLayoutContext = (): ILayoutContext => useContext<ILayoutContext>(LayoutContext)

type LayoutContextProviderProps = {
    children: React.ReactNode
    serviceProblemsAlert?: React.ReactNode
    detectedMobileUserAgentInSSR?: boolean
    initialIsCollapsed?: boolean
}

export const LayoutContextProvider: React.FC<LayoutContextProviderProps> = (props) => {
    const { detectedMobileUserAgentInSSR = false, initialIsCollapsed } = props
    const breakpoints = useBreakpoints()
    const [isCollapsed, setIsCollapsed] = useState(initialIsCollapsed ?? detectedMobileUserAgentInSSR)

    // NOTE: On the first render, the breakpoint returns default values, which may be incorrect.
    const [breakpointsReady, setBreakpointsReady] = useState(false)
    const [isMobileView, setIsMobileView] = useState(detectedMobileUserAgentInSSR)
    useLayoutEffect(() => {
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
        const newValue = !isCollapsed
        // Save this state to cookie to prevent flick on hydration
        setCookie(IS_SIDEBAR_COLLAPSED_COOKIE_NAME, String(newValue), { maxAge:YEAR_IN_SECONDS }) // 1 year
        setIsCollapsed(newValue)
    }

    const shouldTableScroll = !breakpoints.DESKTOP_LARGE

    useLayoutEffect(() => {
        if (initialIsCollapsed === undefined && detectedMobileUserAgentInSSR) {
            // Save this state to cookie to prevent flick on hydration
            setCookie(IS_SIDEBAR_COLLAPSED_COOKIE_NAME, 'true', { maxAge: YEAR_IN_SECONDS })
            setIsCollapsed(true)
        }
    }, [detectedMobileUserAgentInSSR, initialIsCollapsed])

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
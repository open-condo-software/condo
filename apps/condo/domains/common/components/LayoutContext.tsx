import { Grid } from 'antd'
import { ScreenMap } from 'antd/es/_util/responsiveObserve'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { detectMobileNavigator } from '../utils/navigator'
import { ITopNotification, useTopNotificationsHook } from './TopNotifications'

const { useBreakpoint } = Grid

interface ILayoutContext {
    isMobile?: boolean
    isSmall?: boolean
    shouldTableScroll?: boolean
    breakpoints?: ScreenMap
    isCollapsed?: boolean
    toggleCollapsed?: () => void
    addNotification?: (notification: ITopNotification) => void
}

const LayoutContext = createContext<ILayoutContext>({})

export const useLayoutContext = (): ILayoutContext => useContext<ILayoutContext>(LayoutContext)

export const LayoutContextProvider: React.FC = (props) => {
    const breakpoints = useBreakpoint()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const {
        TopNotificationComponent,
        addNotification,
    } = useTopNotificationsHook()

    const toggleCollapsed = () => {
        localStorage && localStorage.setItem('isCollapsed', String(!isCollapsed))
        setIsCollapsed(!isCollapsed)
    }

    const isSmall = (breakpoints.md || breakpoints.xs || breakpoints.sm) && !breakpoints.lg
    const shouldTableScroll = (breakpoints.md || breakpoints.xs || breakpoints.sm) && !breakpoints.xl

    useEffect(() => {
        const isCollapsed = localStorage.getItem('isCollapsed') === 'true'

        setIsCollapsed(isCollapsed)
    }, [])

    return (
        <LayoutContext.Provider value={{
            isMobile: detectMobileNavigator(),
            isSmall,
            shouldTableScroll,
            breakpoints,
            isCollapsed,
            toggleCollapsed,
            addNotification,
        }}>
            <TopNotificationComponent/>
            {props.children}
        </ LayoutContext.Provider>
    )
}
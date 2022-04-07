import { Grid } from 'antd'
import { ScreenMap } from 'antd/es/_util/responsiveObserve'
import React, { createContext, useContext } from 'react'

const { useBreakpoint } = Grid

interface ILayoutContext {
    isMobile?: boolean
    isSmall?: boolean
    breakpoints?: ScreenMap
    isCollapsed?: boolean
    toggleCollapsed?: () => void
}

const detectMobileNavigator = (): boolean => {
    return (
        typeof window !== 'undefined'
        && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent)
    )
}
const LayoutContext = createContext<ILayoutContext>({})

export const useLayoutContext = (): ILayoutContext => useContext<ILayoutContext>(LayoutContext)

export const LayoutContextProvider: React.FC = (props) => {
    const breakpoints = useBreakpoint()
    const isSmall = (breakpoints.md || breakpoints.xs || breakpoints.sm) && !breakpoints.lg

    return (
        <LayoutContext.Provider value={{
            isMobile: detectMobileNavigator(),
            isSmall,
            breakpoints,
        }}>
            {props.children}
        </ LayoutContext.Provider>
    )
}

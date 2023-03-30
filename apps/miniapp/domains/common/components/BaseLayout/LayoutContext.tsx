import React, { createContext, useContext } from 'react'

import { ScreenMap, useBreakpoints } from '@open-condo/ui/dist/hooks'

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
    const breakpoints = useBreakpoints()
    const isSmall = (breakpoints.TABLET_LARGE || breakpoints.MOBILE_SMALL || breakpoints.TABLET_SMALL) && !breakpoints.DESKTOP_SMALL

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
